import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildCandidateInterviewContext } from "../candidate/candidateContextService.js";

const API_URL = (process.env.AI_BASE_URL || "").trim() || "https://api.openai.com/v1/chat/completions";
const MODEL = (process.env.AI_MODEL || "").trim() || "gpt-4o-mini";
const getApiKey = () => (process.env.AI_API_KEY || "").trim();

const fallbackQuestions = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../data/interview-questions.json"), "utf8")
);

function extractSignalsFromAnswer(answerText) {
  const text = (answerText || "").toLowerCase();
  const projects = [];
  const technologies = [];
  const claims = [];

  const techKeywords = [
    "rag", "langchain", "pinecone", "redis", "postgres", "vector", "embedding",
    "python", "react", "node", "express", "fastapi", "docker", "kubernetes",
    "kafka", "spark", "llm", "gpt", "transformer", "bert", "weaviate", "qdrant",
    "chroma", "llamaindex", "finetuning", "prompt", "eval", "javascript", "typescript",
    "mongodb", "aws", "gcp", "azure", "graphql", "rest", "ci/cd"
  ];

  for (const tech of techKeywords) {
    if (text.includes(tech)) {
      technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  }

  if (text.includes("chatbot") || text.includes("agent") || text.includes("pipeline") || text.includes("search engine") || text.includes("dashboard") || text.includes("microservice")) {
    projects.push("Production Pipeline Project");
  }

  // Extract explicit claims (years of experience, specific roles, key achievements)
  const expMatch = text.match(/(\d+)\s*(years|yrs)\s*(of)?\s*([a-z0-9\s]+)?/i);
  if (expMatch) {
    claims.push(`Claimed ${expMatch[1]} years of experience in ${expMatch[4] || "engineering"}`);
  }

  return {
    projects: [...new Set(projects)],
    technologies: [...new Set(technologies)],
    claims
  };
}

function detectClaimInconsistencies(lastAnswerText, previousClaims = []) {
  const text = (lastAnswerText || "").toLowerCase();
  for (const claim of previousClaims) {
    const claimLower = claim.toLowerCase();
    if (claimLower.includes("kubernetes") && (text.includes("never used kubernetes") || text.includes("don't use k8s"))) {
      return "Earlier you mentioned working with Kubernetes deployments, but later indicated limited exposure. Could you clarify your exact role in cluster management?";
    }
    if (claimLower.includes("redis") && (text.includes("never used redis") || text.includes("no experience with caching"))) {
      return "Earlier you mentioned Redis caching, but just noted limited experience with caching layers. Could you elaborate on how caching was managed in your stack?";
    }
  }
  return null;
}

function compactContext({ candidate, eligibleTopics = [], session, lastAnswer = null }) {
  const profile = buildCandidateInterviewContext(candidate);
  return {
    candidateProfile: profile,
    domain: session.domain || "AI / Machine Learning",
    role: session.role || "AI Engineer",
    experienceLevel: session.experienceLevel || "Intermediate",
    eligibleTopics: eligibleTopics.map((topic) => ({ day: topic.day, topic: topic.topic, module: topic.module, attempts: topic.attempts })),
    coveredDays: session.curriculumDaysCovered || [],
    phase: session.phase || "warmup",
    difficulty: session.difficulty || "intermediate",
    candidateSignals: session.candidateSignals || {},
    candidateClaims: session.candidateClaims || [],
    questionsAsked: (session.questions || []).map((question) => ({ id: question.id, day: question.curriculumDay, topic: question.topic, type: question.type })),
    recentConversation: [
      ...(session.conversationHistory || []).slice(-6),
      ...(lastAnswer ? [{
        role: "candidate",
        content: lastAnswer.answer,
        questionId: lastAnswer.questionId,
        order: (session.conversationHistory || []).length + 1
      }] : [])
    ]
  };
}

function getCoveragePolicy(session, eligibleTopics = []) {
  const totalQuestions = (session.questions || []).length;
  const primaryQuestions = (session.questions || []).filter((question) => !question.isFollowUp).length;
  const covered = new Set(session.curriculumDaysCovered || []);
  const uncoveredEligibleDays = [...new Set((eligibleTopics || []).map((topic) => topic.day).filter((day) => !covered.has(day)))];
  const lastQuestion = (session.questions || []).at(-1);
  return {
    totalQuestionsAsked: totalQuestions,
    primaryQuestions,
    uniqueDaysCovered: covered.size,
    uncoveredEligibleDays,
    requiresNewDay: covered.size < 4 && uncoveredEligibleDays.length > 0,
    requiresMoreQuestions: totalQuestions < 8,
    mustAskPrimary: totalQuestions < 8 && lastQuestion?.isFollowUp === true
  };
}

/**
 * Expected-answer & rubric-based evaluator.
 * Evaluates semantic concepts, required concepts, incorrect claims, and relevance.
 */
function evaluateAnswerFallback(answerText, questionObj) {
  const text = (answerText || "").trim();
  const lower = text.toLowerCase();

  // 1. "I don't know" or refusal
  if (lower.includes("don't know") || lower.includes("not sure") || lower.includes("no idea") || lower.length < 4) {
    return {
      decision: "incorrect",
      score: 48,
      confidence: 0.90,
      technicalKnowledge: 45,
      problemSolving: 50,
      systemDesign: 40,
      productionThinking: 40,
      communication: 60,
      practicalExperience: 45,
      strengths: ["Honest about boundaries of technical knowledge"],
      weaknesses: ["Lacks direct knowledge on the requested topic"],
      missingConcepts: ["Core domain principles", "Practical architecture"],
      incorrectClaims: []
    };
  }

  // 2. Clarification Request
  if (lower.startsWith("what do you mean") || lower.includes("can you clarify") || lower.includes("what is meant by")) {
    return {
      decision: "unclear",
      score: 72,
      confidence: 0.95,
      technicalKnowledge: 70,
      problemSolving: 75,
      systemDesign: 70,
      productionThinking: 65,
      communication: 88,
      practicalExperience: 70,
      strengths: ["Proactively asks for clarifying domain scope"],
      weaknesses: [],
      missingConcepts: [],
      incorrectClaims: []
    };
  }

  // 3. Incorrect Claims Detection & Penalty
  const incorrectClaims = [];
  if (lower.includes("impossible to hack") || lower.includes("100% secure") || lower.includes("guarantees permanent storage") || lower.includes("zero latency")) {
    incorrectClaims.push("Exaggerated technical guarantee (e.g. impossible to hack / zero latency)");
  }
  if (lower.includes("redis is a relational database") || lower.includes("kubernetes is a programming language")) {
    incorrectClaims.push("Factual error in core technology definitions");
  }

  // 4. Relevance & Concept Matching
  let matchingConcepts = 0;
  const keyConcepts = questionObj?.keyConcepts || ["architecture", "trade-off", "performance", "latency", "scale"];
  for (const concept of keyConcepts) {
    if (lower.includes(concept.toLowerCase())) matchingConcepts++;
  }

  let score = 70;
  const strengths = [];
  const weaknesses = [];

  if (matchingConcepts > 0) {
    score += Math.min(15, matchingConcepts * 5);
    strengths.push(`Addressed key domain concepts (${matchingConcepts} concept areas covered)`);
  }

  if (lower.includes("trade-off") || lower.includes("tradeoff") || lower.includes("because") || lower.includes("versus") || lower.includes("vs")) {
    score += 6;
    strengths.push("Explicitly evaluated design trade-offs and rationale");
  }

  if (lower.includes("latency") || lower.includes("scale") || lower.includes("cache") || lower.includes("production") || lower.includes("monitoring")) {
    score += 6;
    strengths.push("Demonstrates production-level systems thinking");
  }

  // Deduct for incorrect claims
  if (incorrectClaims.length > 0) {
    score -= incorrectClaims.length * 15;
    weaknesses.push(...incorrectClaims);
  }

  const clampedScore = Math.min(96, Math.max(35, score));
  let decision = "correct_complete";
  if (clampedScore < 60) decision = "incorrect";
  else if (clampedScore < 75) decision = "partially_correct";
  else if (clampedScore > 88) decision = "excellent";

  return {
    decision,
    score: clampedScore,
    confidence: 0.88,
    technicalKnowledge: Math.min(100, clampedScore + 2),
    problemSolving: clampedScore,
    systemDesign: Math.max(40, clampedScore - 4),
    productionThinking: Math.max(40, clampedScore - 5),
    communication: Math.min(100, clampedScore + 4),
    practicalExperience: clampedScore,
    strengths: strengths.length ? strengths : ["Communicated technical approach clearly"],
    weaknesses: weaknesses.length ? weaknesses : ["Could provide further quantitative benchmark metrics"],
    missingConcepts: matchingConcepts === 0 ? ["Specific technical mechanism detail"] : [],
    incorrectClaims
  };
}

function fallbackInterviewResponse({ candidate, eligibleTopics = [], session, lastAnswer }) {
  const primaryQuestions = (session.questions || []).filter((q) => !q.isFollowUp).length;
  const totalQuestions = (session.questions || []).length;
  const lastQuestion = lastAnswer ? (session.questions || []).find((q) => q.id === lastAnswer.questionId) : null;
  const answerText = lastAnswer?.answer || "";
  const domain = session.domain || "AI / Machine Learning";
  const role = session.role || "AI Engineer";
  const experienceLevel = session.experienceLevel || "Intermediate";

  // Warm-up question (Question 1) - Domain & Role Aware
  if (totalQuestions === 0) {
    const text = `Welcome! I'm your AI interviewer for the ${role} position (${domain} domain, ${experienceLevel} level). To begin, please introduce yourself, your experience background, and a recent technical project you built.`;
    return {
      action: "new_topic",
      phase: "warmup",
      difficulty: session.difficulty || "intermediate",
      question: {
        id: randomUUID(),
        day: 1,
        topic: `${domain} Warm-Up`,
        type: "primary",
        domain,
        role,
        difficulty: session.difficulty || "intermediate",
        question: text,
        text: text
      },
      assessment: null
    };
  }

  const assessment = lastAnswer ? evaluateAnswerFallback(answerText, lastQuestion) : null;
  const signals = lastAnswer ? extractSignalsFromAnswer(answerText) : { projects: [], technologies: [], claims: [] };
  const coveredDaysSet = new Set(session.curriculumDaysCovered || []);
  const lastWasFollowUp = lastQuestion?.isFollowUp === true || lastQuestion?.type === "follow-up" || lastQuestion?.type === "clarification";

  // Check for contradiction in candidate claims
  const contradictionQuestionText = lastAnswer ? detectClaimInconsistencies(answerText, session.candidateClaims || []) : null;
  if (contradictionQuestionText) {
    return {
      action: "clarify",
      phase: session.phase || "technical",
      difficulty: session.difficulty || "intermediate",
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: "Experience Clarification",
        type: "clarification",
        domain,
        role,
        difficulty: session.difficulty || "intermediate",
        question: contradictionQuestionText,
        text: contradictionQuestionText,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // Clarification request handling
  if (answerText.toLowerCase().startsWith("what do you mean") || answerText.toLowerCase().includes("can you clarify")) {
    const text = `To clarify: I'm asking about your specific technical approach and trade-offs for ${lastQuestion?.topic || "this scenario"}. Walk me through your design reasoning step-by-step.`;
    return {
      action: "clarify",
      phase: session.phase || "technical",
      difficulty: session.difficulty || "intermediate",
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: lastQuestion?.topic || "Technical Clarification",
        type: "clarification",
        domain,
        role,
        difficulty: session.difficulty || "intermediate",
        question: text,
        text: text,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // If answer was "I don't know", ask a diagnostic question
  if (answerText.toLowerCase().includes("don't know") || answerText.toLowerCase().includes("not sure")) {
    const text = `That's completely fine. If you encountered a problem related to ${lastQuestion?.topic || "this area"} in production, how would you start investigating or debugging it?`;
    return {
      action: "follow_up",
      phase: "technical",
      difficulty: "intermediate",
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: `${lastQuestion?.topic || "Topic"} Diagnostics`,
        type: "follow-up",
        domain,
        role,
        difficulty: "intermediate",
        question: text,
        text: text,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // If previous question was NOT a follow-up, generate a contextual follow-up based on candidate answer signals
  if (!lastWasFollowUp && (signals.projects.length > 0 || signals.technologies.length > 0)) {
    const tech = signals.technologies[0] || signals.projects[0] || "your stack";
    const text = `You mentioned using ${tech}. What were the key architectural trade-offs you faced when adopting ${tech}, and how did you handle edge-case failures in production?`;
    return {
      action: "follow_up",
      phase: "project",
      difficulty: session.difficulty || "intermediate",
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: `${tech} Architecture & Trade-offs`,
        type: "follow-up",
        domain,
        role,
        difficulty: session.difficulty || "intermediate",
        question: text,
        text: text,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  if (!lastWasFollowUp && lastAnswer && lastQuestion) {
    const followText = `Building on your response regarding ${lastQuestion.topic}: what potential bottlenecks or failure modes would you monitor for in production, and how would you resolve them?`;
    return {
      action: "follow_up",
      phase: "technical",
      difficulty: session.difficulty || "intermediate",
      question: {
        id: randomUUID(),
        day: Number(lastQuestion.curriculumDay) || 7,
        topic: lastQuestion.topic,
        type: "follow-up",
        domain,
        role,
        difficulty: session.difficulty || "intermediate",
        question: followText,
        text: followText,
        parentQuestionId: lastQuestion.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // Pick a new topic from an uncovered curriculum day to satisfy 4+ curriculum days & 8+ questions
  const coveredTopicKeys = new Set((session.questions || []).map((q) => `${q.curriculumDay}|${q.topic}`));
  
  // Match questions by domain if available in fallbackQuestions
  const domainQuestions = fallbackQuestions.filter((q) => !q.domain || q.domain === domain || domain.includes("AI") && q.domain?.includes("AI"));
  
  let eligibleQuestion = null;
  if (coveredDaysSet.size < 4) {
    eligibleQuestion = domainQuestions.find((q) => !coveredDaysSet.has(Number(q.day)));
  }
  if (!eligibleQuestion) {
    eligibleQuestion = domainQuestions.find((q) => !coveredTopicKeys.has(`${q.day}|${q.topic}`))
      || fallbackQuestions.find((q) => !coveredTopicKeys.has(`${q.day}|${q.topic}`))
      || fallbackQuestions[primaryQuestions % Math.max(1, fallbackQuestions.length)];
  }

  const topicName = eligibleQuestion?.topic || `${domain} Engineering`;
  const dayNum = eligibleQuestion ? Number(eligibleQuestion.day) : (primaryQuestions + 1) * 3;
  const promptText = eligibleQuestion?.prompt || `Explain the key architecture, design trade-offs, and failure handling strategy for ${topicName}.`;

  // Adjust difficulty adaptively
  let nextDifficulty = session.difficulty || "intermediate";
  if (assessment?.score > 85) nextDifficulty = "advanced";
  else if (assessment?.score < 55) nextDifficulty = "intermediate";

  return {
    action: "new_topic",
    phase: primaryQuestions >= 4 ? "system_design" : "technical",
    difficulty: nextDifficulty,
    question: {
      id: randomUUID(),
      day: dayNum,
      topic: topicName,
      type: "primary",
      domain,
      role,
      difficulty: nextDifficulty,
      question: promptText,
      text: promptText
    },
    assessment,
    extractedSignals: signals
  };
}

function fallbackFinalFeedback(session) {
  const evaluations = session.evaluations || [];
  const avg = (key, defaultVal) => {
    const valid = evaluations.map((e) => e[key]).filter((v) => Number.isFinite(v));
    if (!valid.length) return defaultVal;
    return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
  };

  const overall = avg("score", 78);
  const tech = avg("technicalKnowledge", Math.min(100, overall + 2));
  const problem = avg("problemSolving", overall);
  const sysDesign = avg("systemDesign", Math.max(40, overall - 4));
  const production = avg("productionThinking", Math.max(40, overall - 6));
  const comm = avg("communication", Math.min(100, overall + 4));
  const practical = avg("practicalExperience", overall);

  const topicsCovered = [...new Set((session.questions || []).map((q) => q.topic).filter(Boolean))];
  const uniqueDays = [...new Set(session.curriculumDaysCovered || [])];
  const questionsAskedCount = (session.questions || []).length;
  const followUpsAskedCount = session.followUpCount || (session.questions || []).filter((q) => q.isFollowUp).length;

  return {
    overallScore: overall,
    technicalKnowledge: tech,
    problemSolving: problem,
    systemDesign: sysDesign,
    productionThinking: production,
    communication: comm,
    practicalExperience: practical,
    domain: session.domain || "AI / Machine Learning",
    role: session.role || "AI Engineer",
    experienceLevel: session.experienceLevel || "Intermediate",
    strengths: [
      "Communicated architectural choices and problem-solving steps clearly",
      "Demonstrated practical familiarity with modern engineering stack components"
    ],
    weaknesses: [
      "Deeper focus recommended on production observability and distributed failure modes",
      "Incorporate explicit quantitative metrics and benchmark numbers when discussing performance"
    ],
    summary: `Candidate completed ${questionsAskedCount} technical interview interactions for the ${session.role || "Technical"} role across ${uniqueDays.length} curriculum days with solid evidence-based technical reasoning.`,
    topicsToRevise: topicsCovered.slice(-3),
    recommendations: [
      "Practice detailing system design bottlenecks and cache invalidation strategies",
      "Incorporate explicit metrics and benchmark numbers when discussing performance"
    ],
    curriculumCoverage: {
      daysCovered: uniqueDays,
      count: uniqueDays.length
    },
    questionsAsked: questionsAskedCount,
    followUpsAsked: followUpsAskedCount,
    questionPerformance: (session.questions || []).map((q) => {
      const evalObj = evaluations.find((e) => e.questionId === q.id);
      return {
        topic: q.topic || "Technical Evaluation",
        score: evalObj?.score || overall
      };
    })
  };
}

let lastFallbackQuote = null;

export async function generateInterviewQuote({ candidate }) {
  const instruction = "Create one original, concise, motivating quote for a technical interview candidate. Return JSON only: {quote}. Do not quote or imitate a known person. 12-24 words, professional, memorable, and different each time.";
  try {
    const data = await structuredCompletion(instruction, {
      candidate: { name: candidate.member.name, role: candidate.member.jobRole },
      nonce: randomUUID()
    });
    if (typeof data.quote === "string" && data.quote.trim()) return data.quote.trim();
  } catch {
    // Fall back to quote pool when AI provider unavailable
  }
  const ideas = [
    "Your best answer is the one that makes your reasoning visible.",
    "Be curious, think clearly, and let every answer show how you solve problems.",
    "Strong engineers do not rush to answers; they make the important trade-offs visible.",
    "Explain the trade-off, not just the choice — that is what separates senior thinking.",
    "Slow down enough to reason out loud; that is the interview, not the final answer.",
    "The strongest signal is not the answer you give, but how you got there.",
    "Precision beats confidence. Say exactly what you know, and exactly where you are unsure.",
    "A good engineer names the failure modes before anyone asks about them.",
    "Depth over breadth: one well-reasoned trade-off beats five surface-level facts.",
    "Interviews reward clarity of thought more than volume of words."
  ];
  const pool = lastFallbackQuote ? ideas.filter((idea) => idea !== lastFallbackQuote) : ideas;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  lastFallbackQuote = choice;
  return choice;
}

async function structuredCompletion(instruction, context) {
  if (!getApiKey()) throw Object.assign(new Error("AI interviewer is not configured."), { code: "AI_NOT_CONFIGURED" });
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getApiKey()}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.35,
      messages: [{ role: "system", content: instruction }, { role: "user", content: JSON.stringify(context) }]
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw Object.assign(new Error("AI interviewer is temporarily unavailable."), { code: "AI_PROVIDER_ERROR" });
  const payload = await response.json();
  try {
    return JSON.parse(payload.choices?.[0]?.message?.content || "");
  } catch {
    throw Object.assign(new Error("AI interviewer returned an invalid response."), { code: "AI_INVALID_RESPONSE" });
  }
}

function validateQuestion(value, eligibleTopics = [], parentQuestionId = null, session = {}) {
  if (!value || typeof value.question !== "string" || !value.question.trim()) return null;
  const eligibleTopic = eligibleTopics.find((topic) => topic.day === Number(value?.day));
  const topic = value.topic || eligibleTopic?.topic || "Technical Knowledge";
  const day = Number.isFinite(Number(value?.day)) ? Number(value.day) : (eligibleTopic?.day || 1);
  const type = ["primary", "follow-up", "clarification", "scenario", "WARMUP", "PROJECT", "TECHNICAL", "PRACTICAL", "PROBLEM_SOLVING", "SYSTEM_DESIGN", "PRODUCTION"].includes(value.type) ? value.type : "primary";

  return {
    id: value.id || randomUUID(),
    parentQuestionId,
    day,
    topic: topic.trim(),
    type,
    domain: value.domain || session.domain || "AI / Machine Learning",
    role: value.role || session.role || "AI Engineer",
    difficulty: ["beginner", "foundation", "intermediate", "advanced", "expert"].includes(value.difficulty) ? value.difficulty : (session.difficulty || "intermediate"),
    text: value.question.trim()
  };
}

function validateAssessment(value) {
  if (!value) return null;
  const score = Number.isFinite(value.score) ? Math.min(100, Math.max(0, value.score)) : 75;
  return {
    score,
    decision: value.decision || (score > 85 ? "excellent" : score > 70 ? "correct_complete" : score > 55 ? "partially_correct" : "incorrect"),
    confidence: Number.isFinite(value.confidence) ? value.confidence : 0.85,
    technicalKnowledge: Number.isFinite(value.technicalKnowledge) ? value.technicalKnowledge : score,
    problemSolving: Number.isFinite(value.problemSolving) ? value.problemSolving : score,
    systemDesign: Number.isFinite(value.systemDesign) ? value.systemDesign : score,
    productionThinking: Number.isFinite(value.productionThinking) ? value.productionThinking : score,
    communication: Number.isFinite(value.communication) ? value.communication : score,
    practicalExperience: Number.isFinite(value.practicalExperience) ? value.practicalExperience : score,
    strengths: Array.isArray(value.strengths) ? value.strengths : [],
    weaknesses: Array.isArray(value.weaknesses) ? value.weaknesses : [],
    missingConcepts: Array.isArray(value.missingConcepts) ? value.missingConcepts : [],
    incorrectClaims: Array.isArray(value.incorrectClaims) ? value.incorrectClaims : []
  };
}

export async function generateInterviewResponse({ candidate, eligibleTopics = [], session, lastAnswer = null }) {
  if (!getApiKey()) return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });
  const coveragePolicy = getCoveragePolicy(session, eligibleTopics);
  const instruction = "You are a world-class adaptive AI technical interviewer. Return JSON only: {action,phase,difficulty,question:{id,day,topic,type,domain,role,difficulty,question},extractedSignals:{projects,technologies,claims},assessment:{decision,score,confidence,technicalKnowledge,problemSolving,systemDesign,productionThinking,communication,practicalExperience,strengths,weaknesses,missingConcepts,incorrectClaims}}. Ask one question at a time. Adapt difficulty based on candidate performance. Use previous answers to generate project follow-ups or clarify ambiguities. Never expose raw scores or give away answers.";

  try {
    const data = await structuredCompletion(instruction, { ...compactContext({ candidate, eligibleTopics, session, lastAnswer }), lastAnswer, coveragePolicy });
    const question = validateQuestion(data.question, eligibleTopics, lastAnswer?.questionId || null, session);
    if (!question) return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });

    const assessment = lastAnswer ? validateAssessment(data.assessment) : null;
    return {
      question,
      assessment,
      action: data.action || "new_topic",
      phase: data.phase || session.phase || "technical",
      difficulty: data.difficulty || session.difficulty || "intermediate",
      extractedSignals: data.extractedSignals || extractSignalsFromAnswer(lastAnswer?.answer)
    };
  } catch (err) {
    return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });
  }
}

export async function generateFinalFeedback({ candidate, eligibleTopics = [], session }) {
  if (!getApiKey()) return fallbackFinalFeedback(session);
  const instruction = "You are an AI interview evaluator. Return JSON only with: overallScore, technicalKnowledge, problemSolving, systemDesign, productionThinking, communication, practicalExperience, strengths, weaknesses, summary, topicsToRevise, recommendations, curriculumCoverage, questionPerformance. Claims must be grounded in actual interview answers. Scores 0-100.";

  try {
    const feedback = await structuredCompletion(instruction, { ...compactContext({ candidate, eligibleTopics, session }), answers: session.answers, evaluations: session.evaluations });
    const scoreFields = ["overallScore", "technicalKnowledge", "problemSolving", "systemDesign", "productionThinking", "communication", "practicalExperience"];
    for (const field of scoreFields) {
      if (!Number.isFinite(feedback[field])) feedback[field] = 78;
    }
    if (!Array.isArray(feedback.strengths)) feedback.strengths = ["Solid technical understanding"];
    if (!Array.isArray(feedback.weaknesses)) feedback.weaknesses = ["Could provide more production metrics"];
    if (!Array.isArray(feedback.topicsToRevise)) feedback.topicsToRevise = ["System Design"];
    if (!Array.isArray(feedback.recommendations)) feedback.recommendations = ["Practice explainability"];
    if (!Array.isArray(feedback.questionPerformance)) feedback.questionPerformance = [];

    const uniqueDays = [...new Set(session.curriculumDaysCovered || [])];
    feedback.curriculumCoverage = {
      daysCovered: uniqueDays,
      count: uniqueDays.length
    };
    feedback.questionsAsked = (session.questions || []).length;
    feedback.followUpsAsked = session.followUpCount || (session.questions || []).filter((q) => q.isFollowUp).length;
    feedback.domain = session.domain;
    feedback.role = session.role;
    feedback.experienceLevel = session.experienceLevel;

    if (!feedback.summary) {
      feedback.summary = `Candidate completed ${feedback.questionsAsked} questions for ${session.role || "Technical Role"} spanning ${uniqueDays.length} curriculum days with solid technical performance.`;
    }

    return feedback;
  } catch {
    return fallbackFinalFeedback(session);
  }
}

export const aiConfiguration = () => ({ provider: "OpenAI-compatible Chat Completions", model: MODEL, configured: Boolean(getApiKey()) });
