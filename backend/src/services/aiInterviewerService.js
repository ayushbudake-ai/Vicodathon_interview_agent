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

  const techKeywords = [
    "rag", "langchain", "pinecone", "redis", "postgres", "vector", "embedding",
    "python", "react", "node", "express", "fastapi", "docker", "kubernetes",
    "kafka", "spark", "llm", "gpt", "transformer", "bert", "weaviate", "qdrant",
    "chroma", "llamaIndex", "finetuning", "prompt", "eval"
  ];

  for (const tech of techKeywords) {
    if (text.includes(tech)) {
      technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  }

  if (text.includes("chatbot") || text.includes("agent") || text.includes("pipeline") || text.includes("search engine") || text.includes("dashboard")) {
    projects.push("AI/Data Pipeline Project");
  }

  return { projects: [...new Set(projects)], technologies: [...new Set(technologies)] };
}

function compactContext({ candidate, eligibleTopics = [], session, lastAnswer = null }) {
  const profile = buildCandidateInterviewContext(candidate);
  return {
    candidateProfile: profile,
    eligibleTopics: eligibleTopics.map((topic) => ({ day: topic.day, topic: topic.topic, module: topic.module, attempts: topic.attempts })),
    coveredDays: session.curriculumDaysCovered || [],
    phase: session.phase || "warmup",
    difficulty: session.difficulty || "intermediate",
    candidateSignals: session.candidateSignals || {},
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
 * Deterministic, rubric-based evaluation for fallback mode.
 * NEVER derives score from answer length! Evaluates signal content, depth terms, and clarity.
 */
function evaluateAnswerFallback(answerText, questionTopic) {
  const text = (answerText || "").trim();
  const lower = text.toLowerCase();

  // Handle "I don't know" or refusal
  if (lower.includes("don't know") || lower.includes("not sure") || lower.includes("no idea") || lower.length < 5) {
    return {
      score: 50,
      technicalKnowledge: 45,
      problemSolving: 55,
      systemDesign: 45,
      productionThinking: 45,
      communication: 60,
      practicalExperience: 45,
      technicalUnderstanding: 45,
      reasoning: 55,
      confidence: 40,
      strengths: ["Honest about boundaries of knowledge"],
      weaknesses: ["Lacks direct knowledge on the topic"],
      missingConcepts: ["Core domain definitions", "Practical architecture"]
    };
  }

  // Handle Clarification Requests
  if (lower.startsWith("what do you mean") || lower.includes("can you clarify") || lower.includes("what is meant by")) {
    return {
      score: 70,
      technicalKnowledge: 70,
      problemSolving: 75,
      systemDesign: 70,
      productionThinking: 65,
      communication: 85,
      practicalExperience: 70,
      technicalUnderstanding: 70,
      reasoning: 75,
      confidence: 70,
      strengths: ["Proactively asks for clarifying domain scope"],
      weaknesses: [],
      missingConcepts: []
    };
  }

  // Rubric scoring based on technical depth indicators (trade-offs, latency, architecture, validation)
  let score = 70;
  const strengths = [];
  const weaknesses = [];

  if (lower.includes("trade-off") || lower.includes("tradeoff") || lower.includes("because") || lower.includes("versus") || lower.includes("vs")) {
    score += 8;
    strengths.push("Explicitly evaluated design trade-offs");
  }
  if (lower.includes("latency") || lower.includes("scale") || lower.includes("cache") || lower.includes("production") || lower.includes("monitoring")) {
    score += 8;
    strengths.push("Demonstrates production-level systems thinking");
  }
  if (lower.includes("measure") || lower.includes("benchmark") || lower.includes("test") || lower.includes("metric") || lower.includes("eval")) {
    score += 6;
    strengths.push("Includes empirical verification or metric tracking");
  }

  if (!lower.includes("because") && !lower.includes("why")) {
    weaknesses.push("Could expand more on rationale behind design decisions");
  }

  const clampedScore = Math.min(95, Math.max(55, score));

  return {
    score: clampedScore,
    technicalKnowledge: Math.min(100, clampedScore + 2),
    problemSolving: clampedScore,
    systemDesign: Math.max(40, clampedScore - 5),
    productionThinking: Math.max(40, clampedScore - 5),
    communication: Math.min(100, clampedScore + 5),
    practicalExperience: clampedScore,
    technicalUnderstanding: clampedScore,
    reasoning: clampedScore,
    confidence: 75,
    strengths: strengths.length ? strengths : ["Communicated technical approach clearly"],
    weaknesses: weaknesses.length ? weaknesses : ["Consider discussing edge cases and failure modes"],
    missingConcepts: []
  };
}

function fallbackInterviewResponse({ candidate, eligibleTopics = [], session, lastAnswer }) {
  const primaryQuestions = (session.questions || []).filter((q) => !q.isFollowUp).length;
  const totalQuestions = (session.questions || []).length;
  const lastQuestion = lastAnswer ? (session.questions || []).find((q) => q.id === lastAnswer.questionId) : null;
  const answerText = lastAnswer?.answer || "";

  // Warm-up question (Question 1)
  if (totalQuestions === 0) {
    const text = `Welcome! I'm your AI interviewer. To start off our session, please tell me briefly about yourself, your recent technical background, and a project you've built recently.`;
    return {
      action: "new_topic",
      phase: "warmup",
      question: {
        id: randomUUID(),
        day: 1,
        topic: "Introduction & Warm-Up",
        type: "primary",
        difficulty: "intermediate",
        question: text,
        text: text
      },
      assessment: null
    };
  }

  const assessment = lastAnswer ? evaluateAnswerFallback(answerText, lastQuestion?.topic) : null;
  const signals = lastAnswer ? extractSignalsFromAnswer(answerText) : { projects: [], technologies: [] };
  const coveredDaysSet = new Set(session.curriculumDaysCovered || []);
  const lastWasFollowUp = lastQuestion?.isFollowUp === true || lastQuestion?.type === "follow-up" || lastQuestion?.type === "clarification";

  // Clarification request handling
  if (answerText.toLowerCase().startsWith("what do you mean") || answerText.toLowerCase().includes("can you clarify")) {
    const text = `Great question. I'm looking for your specific reasoning, design trade-offs, or hands-on experience on that topic. Walk me through your mental model or approach step-by-step.`;
    return {
      action: "clarify",
      phase: session.phase || "technical",
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: lastQuestion?.topic || "Technical Clarification",
        type: "clarification",
        difficulty: "intermediate",
        question: text,
        text: text,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // If previous question was NOT a follow-up, generate a contextual follow-up based on signals or previous topic
  if (!lastWasFollowUp && (signals.projects.length > 0 || signals.technologies.length > 0)) {
    const tech = signals.technologies[0] || signals.projects[0] || "your stack";
    const text = `You mentioned working with ${tech}. What were the key architectural trade-offs you faced when choosing ${tech}, and how did you measure its performance in production?`;
    return {
      action: "follow_up",
      phase: "project",
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: `${tech} Architecture`,
        type: "follow-up",
        difficulty: "intermediate",
        question: text,
        text: text,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  if (!lastWasFollowUp && lastAnswer && lastQuestion) {
    const followText = `Expanding on your previous point about ${lastQuestion.topic}: what failure modes or bottleneck risks would you monitor for, and how would you mitigate them?`;
    return {
      action: "follow_up",
      phase: "technical",
      question: {
        id: randomUUID(),
        day: Number(lastQuestion.curriculumDay) || 7,
        topic: lastQuestion.topic,
        type: "follow-up",
        difficulty: "intermediate",
        question: followText,
        text: followText,
        parentQuestionId: lastQuestion.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // Otherwise (after a follow-up or when moving forward), pick a new topic from an uncovered curriculum day
  const coveredTopicKeys = new Set((session.questions || []).map((q) => `${q.curriculumDay}|${q.topic}`));
  
  let eligible = null;
  if (coveredDaysSet.size < 4) {
    eligible = (eligibleTopics || []).find((topic) => !coveredDaysSet.has(topic.day));
  }
  if (!eligible) {
    eligible = (eligibleTopics || []).find((topic) => !coveredTopicKeys.has(`${topic.day}|${topic.topic}`))
      || (eligibleTopics || [])[primaryQuestions % Math.max(1, (eligibleTopics || []).length)];
  }

  const source = eligible
    ? fallbackQuestions.find((q) => Number(q.day) === Number(eligible.day) && q.topic === eligible.topic)
    : null;

  const topicName = eligible?.topic || "System Design & AI Engineering";
  const dayNum = eligible ? Number(eligible.day) : (primaryQuestions + 1) * 3;
  const promptText = source?.prompt || `Explain the architecture, design trade-offs, and failure handling strategy for ${topicName}.`;

  return {
    action: "new_topic",
    phase: primaryQuestions > 4 ? "system_design" : "technical",
    question: {
      id: randomUUID(),
      day: dayNum,
      topic: topicName,
      type: "primary",
      difficulty: "intermediate",
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

  const overall = avg("score", 76);
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
    strengths: [
      "Communicated architectural choices and problem-solving steps clearly",
      "Demonstrated practical familiarity with modern engineering stack components"
    ],
    weaknesses: [
      "Deeper focus recommended on production observability and distributed failure modes",
      "Could elaborate more on quantitative benchmarks when evaluating trade-offs"
    ],
    summary: `Candidate completed ${questionsAskedCount} technical interview interactions spanning ${uniqueDays.length} curriculum days. Strong communication and practical reasoning.`,
    topicsToRevise: topicsCovered.slice(-3),
    recommendations: [
      "Practice explaining system design bottlenecks and cache invalidation strategies",
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
    "Interviews reward clarity of thought more than volume of words.",
    "Treat every question as an invitation to show how you actually think.",
    "The best candidates narrate their assumptions instead of hiding them."
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

function validateQuestion(value, eligibleTopics = [], parentQuestionId = null) {
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
    difficulty: ["beginner", "foundation", "intermediate", "advanced", "expert"].includes(value.difficulty) ? value.difficulty : "intermediate",
    text: value.question.trim()
  };
}

function validateAssessment(value) {
  if (!value) return null;
  const score = Number.isFinite(value.score) ? Math.min(100, Math.max(0, value.score)) : 75;
  return {
    score,
    technicalKnowledge: Number.isFinite(value.technicalKnowledge) ? value.technicalKnowledge : score,
    problemSolving: Number.isFinite(value.problemSolving) ? value.problemSolving : score,
    systemDesign: Number.isFinite(value.systemDesign) ? value.systemDesign : score,
    productionThinking: Number.isFinite(value.productionThinking) ? value.productionThinking : score,
    communication: Number.isFinite(value.communication) ? value.communication : score,
    practicalExperience: Number.isFinite(value.practicalExperience) ? value.practicalExperience : score,
    technicalUnderstanding: Number.isFinite(value.technicalUnderstanding) ? value.technicalUnderstanding : score,
    reasoning: Number.isFinite(value.reasoning) ? value.reasoning : score,
    confidence: Number.isFinite(value.confidence) ? value.confidence : 75,
    strengths: Array.isArray(value.strengths) ? value.strengths : [],
    weaknesses: Array.isArray(value.weaknesses) ? value.weaknesses : [],
    missingConcepts: Array.isArray(value.missingConcepts) ? value.missingConcepts : []
  };
}

export async function generateInterviewResponse({ candidate, eligibleTopics = [], session, lastAnswer = null }) {
  if (!getApiKey()) return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });
  const coveragePolicy = getCoveragePolicy(session, eligibleTopics);
  const instruction = "You are a world-class adaptive AI technical interviewer. Return JSON only: {action,phase,difficulty,question:{id,day,topic,type,difficulty,question},extractedSignals:{projects,technologies},assessment:{score,technicalKnowledge,problemSolving,systemDesign,productionThinking,communication,practicalExperience,strengths,weaknesses,missingConcepts}}. Ask one question at a time. Adapt difficulty based on candidate performance. Use previous answers to generate project follow-ups or clarify ambiguities. Never expose raw scores or give away answers.";

  try {
    const data = await structuredCompletion(instruction, { ...compactContext({ candidate, eligibleTopics, session, lastAnswer }), lastAnswer, coveragePolicy });
    const question = validateQuestion(data.question, eligibleTopics, lastAnswer?.questionId || null);
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
    // If AI generation fails, fall back smoothly to deterministic engine without crashing
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
      if (!Number.isFinite(feedback[field])) feedback[field] = 75;
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
    if (!feedback.summary) {
      feedback.summary = `Candidate completed ${feedback.questionsAsked} questions spanning ${uniqueDays.length} curriculum days with solid technical performance.`;
    }

    return feedback;
  } catch {
    return fallbackFinalFeedback(session);
  }
}

export const aiConfiguration = () => ({ provider: "OpenAI-compatible Chat Completions", model: MODEL, configured: Boolean(getApiKey()) });

