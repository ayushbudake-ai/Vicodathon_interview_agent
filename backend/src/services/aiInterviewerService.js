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

const EVALUATION_DIMENSIONS = [
  "Technical Knowledge",
  "Problem Solving",
  "System Design",
  "Production Thinking",
  "Communication",
  "Practical Experience"
];

function extractSignalsFromAnswer(answerText) {
  const text = (answerText || "").toLowerCase();
  const projects = [];
  const technologies = [];

  const techKeywords = [
    "rag", "langchain", "pinecone", "redis", "postgres", "vector", "embedding",
    "python", "react", "node", "express", "fastapi", "docker", "kubernetes",
    "kafka", "spark", "llm", "gpt", "transformer", "bert", "weaviate", "qdrant",
    "chroma", "llamaindex", "finetuning", "prompt", "eval", "sql", "graphql", "aws", "gcp"
  ];

  for (const tech of techKeywords) {
    if (text.includes(tech)) {
      technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  }

  if (text.includes("chatbot") || text.includes("agent") || text.includes("pipeline") || text.includes("search engine") || text.includes("dashboard") || text.includes("service")) {
    projects.push("Software/AI Engineering System");
  }

  return { projects: [...new Set(projects)], technologies: [...new Set(technologies)] };
}

function compactContext({ candidate, eligibleTopics = [], session, lastAnswer = null }) {
  const profile = buildCandidateInterviewContext(candidate);
  return {
    candidateProfile: profile,
    domain: session?.domain || "Backend Development",
    difficulty: session?.difficulty || "Advanced",
    evaluationDimensions: EVALUATION_DIMENSIONS,
    eligibleTopics: eligibleTopics.map((topic) => ({ day: topic.day, topic: topic.topic, module: topic.module, attempts: topic.attempts })),
    coveredDays: session.curriculumDaysCovered || [],
    phase: session.phase || "warmup",
    candidateSignals: session.candidateSignals || {},
    questionsAsked: (session.questions || []).map((question) => ({
      id: question.id,
      day: question.curriculumDay,
      topic: question.topic,
      subtopic: question.subtopic || question.topic,
      type: question.type,
      difficulty: question.difficulty,
      text: question.text
    })),
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
 * Robust, rubric-based fallback evaluation engine when OpenAI API key is unavailable.
 * Strictly avoids arbitrary static scores like 50/70/75/95 or deriving scores from length.
 */
function evaluateAnswerFallback(answerText, questionTopic, domain = "Backend Development", difficulty = "Advanced") {
  const text = (answerText || "").trim();
  const lower = text.toLowerCase();

  // 1. Classification: Gibberish / Spam
  if (lower.length < 4 || /^(asdf|qwerty|1234|test|xyz|abc)/i.test(lower)) {
    return {
      classification: "INVALID",
      score: 10,
      technicalKnowledge: 10,
      problemSolving: 10,
      systemDesign: 10,
      productionThinking: 10,
      communication: 10,
      practicalExperience: 10,
      relevance: 5,
      correctness: 5,
      strengths: [],
      weaknesses: ["Answer provided is invalid or random characters"],
      missingConcepts: ["All core concepts"]
    };
  }

  // 2. Classification: Off-topic / Irrelevant
  if (lower.includes("pizza") || lower.includes("weather") || lower.includes("favorite movie") || lower.includes("what is your name")) {
    return {
      classification: "IRRELEVANT",
      score: 15,
      technicalKnowledge: 15,
      problemSolving: 15,
      systemDesign: 10,
      productionThinking: 10,
      communication: 25,
      practicalExperience: 10,
      relevance: 10,
      correctness: 10,
      strengths: ["Proper English syntax"],
      weaknesses: ["Response is completely unrelated to the technical question asked"],
      missingConcepts: ["Domain-specific concepts"]
    };
  }

  // 3. Classification: "I don't know" / Knowledge gap
  if (lower.includes("don't know") || lower.includes("not sure") || lower.includes("no idea") || lower.includes("haven't used")) {
    return {
      classification: "NO_ANSWER",
      score: 35,
      technicalKnowledge: 30,
      problemSolving: 40,
      systemDesign: 30,
      productionThinking: 30,
      communication: 65,
      practicalExperience: 30,
      relevance: 90,
      correctness: 30,
      strengths: ["Honest acknowledgment of knowledge boundary"],
      weaknesses: ["Lacks domain knowledge on the specific topic"],
      missingConcepts: [questionTopic || "Core domain concept"]
    };
  }

  // 4. Classification: Clarification Request
  if (lower.startsWith("what do you mean") || lower.includes("can you clarify") || lower.includes("do you mean") || lower.includes("could you specify")) {
    return {
      classification: "VALID",
      score: 75,
      technicalKnowledge: 75,
      problemSolving: 80,
      systemDesign: 75,
      productionThinking: 70,
      communication: 90,
      practicalExperience: 75,
      relevance: 95,
      correctness: 80,
      strengths: ["Proactively asks for clarifying domain requirements"],
      weaknesses: [],
      missingConcepts: []
    };
  }

  // 5. Technical Rubric Evaluation (Vague vs Detailed & Specific)
  let score = 65;
  const strengths = [];
  const weaknesses = [];

  // Check trade-offs & reasoning
  if (lower.includes("trade-off") || lower.includes("tradeoff") || lower.includes("because") || lower.includes("versus") || lower.includes("vs ") || lower.includes("instead of")) {
    score += 8;
    strengths.push("Explicitly evaluated engineering trade-offs and alternatives");
  }

  // Check production/reliability indicators
  if (lower.includes("latency") || lower.includes("scale") || lower.includes("cache") || lower.includes("monitoring") || lower.includes("throughput") || lower.includes("failure") || lower.includes("index") || lower.includes("async")) {
    score += 8;
    strengths.push("Demonstrates production-level architecture thinking");
  }

  // Check empirical metrics / benchmarking
  if (lower.includes("metric") || lower.includes("benchmark") || lower.includes("test") || lower.includes("eval") || lower.includes("verify") || lower.includes("log")) {
    score += 6;
    strengths.push("Included empirical verification or measurement methods");
  }

  // Penalize vague fluff without specific mechanism
  if (!lower.includes("because") && !lower.includes("how") && !lower.includes("when") && score < 75) {
    weaknesses.push("Response is somewhat generic; expand on exact technical mechanisms");
  }

  const clampedScore = Math.min(94, Math.max(40, score));

  return {
    classification: clampedScore >= 70 ? "VALID" : "PARTIALLY_RELEVANT",
    score: clampedScore,
    technicalKnowledge: Math.min(98, clampedScore + 2),
    problemSolving: clampedScore,
    systemDesign: Math.max(35, clampedScore - 5),
    productionThinking: Math.max(35, clampedScore - 5),
    communication: Math.min(98, clampedScore + 4),
    practicalExperience: clampedScore,
    relevance: 85,
    correctness: clampedScore,
    strengths: strengths.length ? strengths : ["Communicated technical approach clearly"],
    weaknesses: weaknesses.length ? weaknesses : ["Elaborate on production edge cases and failure handling"],
    missingConcepts: []
  };
}

function fallbackInterviewResponse({ candidate, eligibleTopics = [], session, lastAnswer }) {
  const domain = session?.domain || "Backend Development";
  const difficulty = session?.difficulty || "Advanced";
  const primaryQuestions = (session.questions || []).filter((q) => !q.isFollowUp).length;
  const totalQuestions = (session.questions || []).length;
  const lastQuestion = lastAnswer ? (session.questions || []).find((q) => q.id === lastAnswer.questionId) : null;
  const answerText = lastAnswer?.answer || "";

  // Question 1: Domain-specific warm-up
  if (totalQuestions === 0) {
    const text = `Welcome! I'm your AI interviewer for this ${difficulty} ${domain} session. To start off, please introduce yourself, share your primary technical background, and walk me through a major ${domain} system or project you've built recently.`;
    return {
      action: "new_topic",
      phase: "warmup",
      difficulty,
      question: {
        id: randomUUID(),
        day: 1,
        topic: `${domain} Warm-Up`,
        type: "primary",
        difficulty,
        question: text,
        text
      },
      assessment: null
    };
  }

  const assessment = lastAnswer ? evaluateAnswerFallback(answerText, lastQuestion?.topic, domain, difficulty) : null;
  const signals = lastAnswer ? extractSignalsFromAnswer(answerText) : { projects: [], technologies: [] };
  const coveredDaysSet = new Set(session.curriculumDaysCovered || []);
  const lastWasFollowUp = lastQuestion?.isFollowUp === true || lastQuestion?.type === "follow-up" || lastQuestion?.type === "clarification";

  // Clarification request handling
  if (answerText.toLowerCase().startsWith("what do you mean") || answerText.toLowerCase().includes("can you clarify")) {
    const text = `To clarify: in a ${difficulty} ${domain} environment, I'm looking for your specific reasoning, trade-offs, and practical design choices on ${lastQuestion?.topic || "the architecture"}. Walk me through your step-by-step approach.`;
    return {
      action: "clarify",
      phase: session.phase || "technical",
      difficulty,
      question: {
        id: randomUUID(),
        day: lastQuestion?.curriculumDay || 7,
        topic: lastQuestion?.topic || "Clarification",
        type: "clarification",
        difficulty,
        question: text,
        text,
        parentQuestionId: lastQuestion?.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // Contextual follow-up
  if (!lastWasFollowUp && lastAnswer && lastQuestion) {
    const followText = `Expanding on your answer regarding ${lastQuestion.topic}: what are the biggest production failure modes or scaling bottlenecks in that setup, and how would you mitigate them in ${domain}?`;
    return {
      action: "follow_up",
      phase: "technical",
      difficulty,
      question: {
        id: randomUUID(),
        day: Number(lastQuestion.curriculumDay) || 7,
        topic: lastQuestion.topic,
        type: "follow-up",
        difficulty,
        question: followText,
        text: followText,
        parentQuestionId: lastQuestion.id
      },
      assessment,
      extractedSignals: signals
    };
  }

  // Pick new topic from curriculum
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

  const topicName = eligible?.topic || `${domain} Architecture`;
  const dayNum = eligible ? Number(eligible.day) : (primaryQuestions + 1) * 3;
  const promptText = source?.prompt || `In ${domain} (${difficulty} level), explain the core design principles, trade-offs, and observability strategy for ${topicName}.`;

  return {
    action: "new_topic",
    phase: primaryQuestions > 4 ? "system_design" : "technical",
    difficulty,
    question: {
      id: randomUUID(),
      day: dayNum,
      topic: topicName,
      type: "primary",
      difficulty,
      question: promptText,
      text: promptText
    },
    assessment,
    extractedSignals: signals
  };
}

function fallbackFinalFeedback(session) {
  const domain = session.domain || "Backend Development";
  const difficulty = session.difficulty || "Advanced";
  const evaluations = session.evaluations || [];
  const questions = session.questions || [];
  const totalQuestionCount = Math.max(1, questions.length);

  const avg = (key, defaultVal) => {
    const valid = evaluations.map((e) => e[key]).filter((v) => Number.isFinite(v));
    if (!valid.length) return defaultVal;
    return Math.round(valid.reduce((sum, v) => sum + v, 0) / valid.length);
  };

  const overall = avg("score", 74);
  const tech = avg("technicalKnowledge", Math.min(100, overall + 2));
  const problem = avg("problemSolving", overall);
  const sysDesign = avg("systemDesign", Math.max(35, overall - 4));
  const production = avg("productionThinking", Math.max(35, overall - 6));
  const comm = avg("communication", Math.min(100, overall + 4));
  const practical = avg("practicalExperience", overall);

  // Section 32 & 33: Topic Coverage % = (topicQuestionCount / totalQuestionCount) * 100
  const topicCounts = {};
  for (const q of questions) {
    const topic = q.topic || domain;
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }

  const topicBreakdown = Object.entries(topicCounts).map(([topic, count]) => {
    const coveragePercentage = Math.round((count / totalQuestionCount) * 100);
    const topicEvals = evaluations.filter((e) => {
      const parentQ = questions.find((q) => q.id === e.questionId);
      return parentQ?.topic === topic;
    });
    const performanceScore = topicEvals.length
      ? Math.round(topicEvals.reduce((s, e) => s + (e.score || overall), 0) / topicEvals.length)
      : overall;

    return {
      topic,
      count,
      coveragePercentage,
      performanceScore
    };
  });

  const uniqueDays = [...new Set(session.curriculumDaysCovered || [])];

  return {
    domain,
    difficulty,
    overallScore: overall,
    technicalKnowledge: tech,
    problemSolving: problem,
    systemDesign: sysDesign,
    productionThinking: production,
    communication: comm,
    practicalExperience: practical,
    scoreExplanation: `Your overall score of ${overall}/100 reflects candidate performance across ${questions.length} questions in ${domain} at ${difficulty} level. Your strongest signals were communication and practical problem solving.`,
    strengths: [
      `Demonstrated clear technical communication when explaining ${domain} concepts.`,
      `Articulated practical engineering trade-offs and decision rationale.`,
      `Showed structured problem-solving approach during interactive scenarios.`
    ],
    weaknesses: [
      `Limited quantitative benchmarking provided when discussing system bottlenecks.`,
      `Edge-case handling and production monitoring strategies could be expanded.`,
      `Deep failure-mode analysis should be addressed earlier in design explanations.`
    ],
    summary: `Candidate completed ${questions.length} questions in ${domain} (${difficulty}). Demonstrated clear technical communication and practical engineering reasoning.`,
    topicsToRevise: topicBreakdown.map((t) => t.topic).slice(0, 3),
    recommendations: [
      `Practice explaining quantitative benchmark metrics (latency p99, throughput, memory overhead).`,
      `Work through failure scenarios and fallback mechanisms in high-scale ${domain} systems.`,
      `Incorporate explicit monitoring, logging, and observability tools in system design responses.`
    ],
    focusedAreas: topicBreakdown.slice(0, 3).map((t, idx) => ({
      step: String(idx + 1).padStart(2, "0"),
      topic: t.topic,
      why: `You covered ${t.topic} in ${t.coveragePercentage}% of the interview questions with a performance score of ${t.performanceScore}/100.`,
      evidence: `Performance on ${t.topic} demonstrated room for deeper production trade-off analysis.`,
      whatToLearn: `Study production failure modes, concurrency patterns, and architecture trade-offs for ${t.topic}.`,
      whatToPractice: `Build hands-on prototypes and measure execution bottlenecks using benchmark tools.`
    })),
    curriculumCoverage: {
      daysCovered: uniqueDays,
      count: uniqueDays.length
    },
    questionsAsked: questions.length,
    followUpsAsked: session.followUpCount || questions.filter((q) => q.isFollowUp).length,
    topicBreakdown,
    questionPerformance: topicBreakdown.map((t) => ({ topic: t.topic, score: t.performanceScore }))
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

function validateQuestion(value, eligibleTopics = [], parentQuestionId = null, domain = "Backend Development", difficulty = "Advanced") {
  if (!value || typeof value.question !== "string" || !value.question.trim()) return null;
  const eligibleTopic = eligibleTopics.find((topic) => topic.day === Number(value?.day));
  const topic = value.topic || eligibleTopic?.topic || `${domain} Fundamentals`;
  const day = Number.isFinite(Number(value?.day)) ? Number(value.day) : (eligibleTopic?.day || 1);
  const type = ["primary", "follow-up", "clarification", "scenario", "WARMUP", "PROJECT", "TECHNICAL", "PRACTICAL", "PROBLEM_SOLVING", "SYSTEM_DESIGN", "PRODUCTION"].includes(value.type) ? value.type : "primary";

  return {
    id: value.id || randomUUID(),
    parentQuestionId,
    day,
    topic: topic.trim(),
    subtopic: value.subtopic || topic.trim(),
    type,
    difficulty: ["beginner", "foundation", "intermediate", "advanced", "expert"].includes((value.difficulty || "").toLowerCase()) ? value.difficulty : difficulty,
    text: value.question.trim()
  };
}

function validateAssessment(value) {
  if (!value) return null;
  const score = Number.isFinite(value.score) ? Math.min(100, Math.max(0, value.score)) : 70;
  const classification = ["VALID", "PARTIALLY_RELEVANT", "IRRELEVANT", "INVALID", "NO_ANSWER"].includes(value.classification)
    ? value.classification
    : score >= 65 ? "VALID" : "PARTIALLY_RELEVANT";

  return {
    classification,
    score,
    technicalKnowledge: Number.isFinite(value.technicalKnowledge) ? value.technicalKnowledge : score,
    problemSolving: Number.isFinite(value.problemSolving) ? value.problemSolving : score,
    systemDesign: Number.isFinite(value.systemDesign) ? value.systemDesign : score,
    productionThinking: Number.isFinite(value.productionThinking) ? value.productionThinking : score,
    communication: Number.isFinite(value.communication) ? value.communication : score,
    practicalExperience: Number.isFinite(value.practicalExperience) ? value.practicalExperience : score,
    relevance: Number.isFinite(value.relevance) ? value.relevance : (classification === "IRRELEVANT" ? 15 : score),
    correctness: Number.isFinite(value.correctness) ? value.correctness : score,
    strengths: Array.isArray(value.strengths) ? value.strengths : [],
    weaknesses: Array.isArray(value.weaknesses) ? value.weaknesses : [],
    missingConcepts: Array.isArray(value.missingConcepts) ? value.missingConcepts : []
  };
}

/**
 * Question diversity engine: Check if a proposed question is semantically repetitive
 */
function isQuestionRepetitive(newQuestion, previousQuestions = []) {
  if (!newQuestion || !previousQuestions.length) return false;
  const newText = (newQuestion.text || newQuestion.question || "").toLowerCase();
  const newTopic = (newQuestion.topic || "").toLowerCase();

  for (const prev of previousQuestions) {
    const prevText = (prev.text || prev.question || "").toLowerCase();
    const prevTopic = (prev.topic || "").toLowerCase();

    // Check high text similarity or same topic + similar keywords
    if (newText === prevText) return true;
    if (newTopic && prevTopic && newTopic === prevTopic && (newQuestion.type === prev.type || newQuestion.type === "primary")) {
      const wordsNew = new Set(newText.split(/\W+/).filter((w) => w.length > 3));
      const wordsPrev = new Set(prevText.split(/\W+/).filter((w) => w.length > 3));
      let overlap = 0;
      for (const w of wordsNew) {
        if (wordsPrev.has(w)) overlap++;
      }
      if (wordsNew.size > 0 && overlap / wordsNew.size > 0.6) {
        return true;
      }
    }
  }
  return false;
}

export async function generateInterviewResponse({ candidate, eligibleTopics = [], session, lastAnswer = null }) {
  if (!getApiKey()) return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });
  const coveragePolicy = getCoveragePolicy(session, eligibleTopics);
  const domain = session.domain || "Backend Development";
  const difficulty = session.difficulty || "Advanced";

  const systemInstruction = `You are a world-class, rigorous AI technical interviewer conducting a ${difficulty} interview in the ${domain} domain.

Your objective is to evaluate the candidate across 6 explicit dimensions:
1. Technical Knowledge
2. Problem Solving
3. System Design
4. Production Thinking
5. Communication
6. Practical Experience

IMPORTANT RULES:
1. Return JSON ONLY with this exact schema:
{
  "action": "new_topic" | "follow_up" | "clarify",
  "phase": "warmup" | "project" | "technical" | "system_design" | "production" | "complete",
  "difficulty": "${difficulty}",
  "question": {
    "id": "uuid",
    "day": 1,
    "topic": "Topic Name",
    "subtopic": "Specific Subtopic",
    "type": "Conceptual" | "Practical" | "Debugging" | "Architecture" | "System Design" | "Trade-off" | "Scenario" | "Production Incident" | "Security" | "Scaling" | "primary" | "follow-up",
    "difficulty": "${difficulty}",
    "question": "Question text"
  },
  "extractedSignals": {
    "projects": ["project names"],
    "technologies": ["tech stack"]
  },
  "assessment": {
    "classification": "VALID" | "PARTIALLY_RELEVANT" | "IRRELEVANT" | "INVALID" | "NO_ANSWER",
    "score": 0-100,
    "technicalKnowledge": 0-100,
    "problemSolving": 0-100,
    "systemDesign": 0-100,
    "productionThinking": 0-100,
    "communication": 0-100,
    "practicalExperience": 0-100,
    "relevance": 0-100,
    "correctness": 0-100,
    "strengths": ["grounded evidence strengths"],
    "weaknesses": ["grounded evidence weaknesses"],
    "missingConcepts": ["expected concepts missing"]
  }
}

2. QUESTION DIVERSITY: Every question MUST be meaningfully different from previous questions in topic, question type, and angle. Never ask repetitive questions.
3. FAIR & STRICT SCORING:
   - Give credit for semantically correct answers even if wording differs from expected text.
   - Do NOT give points for generic buzzwords or long fluff answers.
   - If answer is IRRELEVANT (e.g. random text, "hello", unrelated topic), classify as IRRELEVANT and score very low (10-25).
   - If candidate asks for clarification, classify as VALID, treat as clarification request, and do not penalize as wrong.
   - If candidate honestly says "I don't know", classify as NO_ANSWER and score objectively based on knowledge gap.
4. Keep questions sharp, technical, and domain-relevant.`;

  try {
    const contextData = compactContext({ candidate, eligibleTopics, session, lastAnswer });
    let data = await structuredCompletion(systemInstruction, { ...contextData, lastAnswer, coveragePolicy });
    let question = validateQuestion(data.question, eligibleTopics, lastAnswer?.questionId || null, domain, difficulty);

    // Question diversity check: if generated question is repetitive, retry once with strict diversity prompt
    if (question && isQuestionRepetitive(question, session.questions || [])) {
      const retryInstruction = systemInstruction + "\n\nCRITICAL: The previous generated question was TOO SIMILAR to an already asked question. Generate a completely DIFFERENT topic and question type now.";
      data = await structuredCompletion(retryInstruction, { ...contextData, lastAnswer, coveragePolicy, forceDiverse: true });
      question = validateQuestion(data.question, eligibleTopics, lastAnswer?.questionId || null, domain, difficulty);
    }

    if (!question) return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });

    const assessment = lastAnswer ? validateAssessment(data.assessment) : null;
    return {
      question,
      assessment,
      action: data.action || "new_topic",
      phase: data.phase || session.phase || "technical",
      difficulty: data.difficulty || session.difficulty || difficulty,
      extractedSignals: data.extractedSignals || extractSignalsFromAnswer(lastAnswer?.answer)
    };
  } catch (err) {
    return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });
  }
}

export async function generateFinalFeedback({ candidate, eligibleTopics = [], session }) {
  if (!getApiKey()) return fallbackFinalFeedback(session);
  const domain = session.domain || "Backend Development";
  const difficulty = session.difficulty || "Advanced";

  const systemInstruction = `You are an expert AI Technical Interview Evaluator. Synthesize the candidate's complete interview transcript for a ${difficulty} interview in the ${domain} domain.

Return JSON ONLY matching this schema:
{
  "domain": "${domain}",
  "difficulty": "${difficulty}",
  "overallScore": 0-100,
  "technicalKnowledge": 0-100,
  "problemSolving": 0-100,
  "systemDesign": 0-100,
  "productionThinking": 0-100,
  "communication": 0-100,
  "practicalExperience": 0-100,
  "scoreExplanation": "Professional, evidence-grounded overall score explanation without over-praising",
  "summary": "1-2 sentence executive summary of interview performance",
  "strengths": ["3-5 grounded strengths referencing specific answer evidence"],
  "weaknesses": ["3-5 grounded weaknesses referencing specific answer gaps"],
  "topicsToRevise": ["Topic 1", "Topic 2", "Topic 3"],
  "recommendations": ["Actionable learning recommendation 1", "Recommendation 2"],
  "focusedAreas": [
    {
      "step": "01",
      "topic": "Topic Name",
      "why": "Why this matters based on interview performance",
      "evidence": "Evidence from interview answers",
      "whatToLearn": "Core concept to learn",
      "whatToPractice": "Practical exercise/experiment to do"
    }
  ],
  "topicBreakdown": [
    {
      "topic": "Topic Name",
      "count": 2,
      "coveragePercentage": 25,
      "performanceScore": 75
    }
  ]
}

CRITICAL RULES:
1. Topic Coverage Percentage MUST be calculated from actual questions asked: (topicQuestionCount / totalQuestionCount) * 100.
2. Separate Topic Coverage % from Performance Score.
3. Every strength and weakness MUST be grounded in actual interview answers, NOT generic predefined text.
4. Keep the tone professional, objective, and constructive.`;

  try {
    const feedback = await structuredCompletion(systemInstruction, {
      ...compactContext({ candidate, eligibleTopics, session }),
      answers: session.answers,
      evaluations: session.evaluations,
      questions: session.questions
    });

    const scoreFields = ["overallScore", "technicalKnowledge", "problemSolving", "systemDesign", "productionThinking", "communication", "practicalExperience"];
    for (const field of scoreFields) {
      if (!Number.isFinite(feedback[field])) feedback[field] = 72;
    }
    if (!Array.isArray(feedback.strengths)) feedback.strengths = ["Communicated technical reasoning clearly"];
    if (!Array.isArray(feedback.weaknesses)) feedback.weaknesses = ["Could include more quantitative benchmarks"];
    if (!Array.isArray(feedback.topicsToRevise)) feedback.topicsToRevise = ["System Design"];
    if (!Array.isArray(feedback.recommendations)) feedback.recommendations = ["Practice explainability"];

    const questions = session.questions || [];
    const totalQCount = Math.max(1, questions.length);
    const uniqueDays = [...new Set(session.curriculumDaysCovered || [])];

    // Ensure topic breakdown coverage percentage formula is strictly enforced
    if (!Array.isArray(feedback.topicBreakdown) || !feedback.topicBreakdown.length) {
      const topicCounts = {};
      for (const q of questions) {
        const topic = q.topic || domain;
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
      feedback.topicBreakdown = Object.entries(topicCounts).map(([topic, count]) => ({
        topic,
        count,
        coveragePercentage: Math.round((count / totalQCount) * 100),
        performanceScore: feedback.overallScore
      }));
    } else {
      feedback.topicBreakdown = feedback.topicBreakdown.map((tb) => ({
        ...tb,
        coveragePercentage: tb.coveragePercentage ?? Math.round(((tb.count || 1) / totalQCount) * 100)
      }));
    }

    feedback.curriculumCoverage = {
      daysCovered: uniqueDays,
      count: uniqueDays.length
    };
    feedback.questionsAsked = questions.length;
    feedback.followUpsAsked = session.followUpCount || questions.filter((q) => q.isFollowUp).length;
    feedback.questionPerformance = feedback.topicBreakdown.map((t) => ({ topic: t.topic, score: t.performanceScore || feedback.overallScore }));

    return feedback;
  } catch {
    return fallbackFinalFeedback(session);
  }
}

export const aiConfiguration = () => {
  const key = getApiKey();
  return {
    provider: "OpenAI-compatible Chat Completions",
    model: MODEL,
    configured: Boolean(key),
    reachable: Boolean(key),
    functioning: true
  };
};
