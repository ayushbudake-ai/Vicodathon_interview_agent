import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildCandidateInterviewContext } from "../candidate/candidateContextService.js";

const API_URL = (process.env.AI_BASE_URL || "").trim() || "https://api.openai.com/v1/chat/completions";
const MODEL = (process.env.AI_MODEL || "").trim() || "gpt-4o-mini";
const getApiKey = () => (process.env.AI_API_KEY || "").trim();

function compactContext({ candidate, eligibleTopics, session, lastAnswer = null }) {
  const profile = buildCandidateInterviewContext(candidate);
  return {
    candidateProfile: profile,
    eligibleTopics: eligibleTopics.map((topic) => ({ day: topic.day, topic: topic.topic, module: topic.module, attempts: topic.attempts })),
    coveredDays: session.curriculumDaysCovered,
    questionsAsked: session.questions.map((question) => ({ id: question.id, day: question.curriculumDay, topic: question.topic, type: question.type })),
    recentConversation: [
      ...session.conversationHistory.slice(-6),
      ...(lastAnswer ? [{
        role: "candidate",
        content: lastAnswer.answer,
        questionId: lastAnswer.questionId,
        order: session.conversationHistory.length + 1
      }] : [])
    ]
  };
}

function getCoveragePolicy(session, eligibleTopics) {
  const primaryQuestions = session.questions.filter((question) => !question.isFollowUp).length;
  const covered = new Set(session.curriculumDaysCovered);
  const uncoveredEligibleDays = [...new Set(eligibleTopics.map((topic) => topic.day).filter((day) => !covered.has(day)))];
  const lastQuestion = session.questions.at(-1);
  return { primaryQuestions, uniqueDaysCovered: covered.size, uncoveredEligibleDays, requiresNewDay: covered.size < 4 && uncoveredEligibleDays.length > 0, requiresMorePrimary: primaryQuestions < 8, mustAskPrimary: primaryQuestions < 8 && lastQuestion?.isFollowUp === true };
}


const fallbackQuestions = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../../data/interview-questions.json"), "utf8")
);

function fallbackInterviewResponse({ eligibleTopics, session, lastAnswer }) {
  const coveredTopicKeys = new Set(session.questions.map((q) => `${q.curriculumDay}|${q.topic}`));
  const primaryCount = session.questions.filter((q) => !q.isFollowUp).length;
  const last = lastAnswer ? session.questions.find((q) => q.id === lastAnswer.questionId) : null;

  if (lastAnswer && last) {
    const source = fallbackQuestions.find((q) => Number(q.day) === Number(last.day) && q.topic === last.topic);
    if (source && session.followUpCount < 2) {
      return {
        action: "follow_up",
        question: {
          id: randomUUID(), day: Number(last.day), topic: last.topic, type: "follow-up",
          difficulty: "intermediate", question: source.follow, text: source.follow
        },
        assessment: {
          score: Math.min(100, Math.max(35, Math.round(lastAnswer.answer.length / 5))),
          technicalUnderstanding: 60, reasoning: 60, confidence: 60,
          strengths: [], weaknesses: [], missingConcepts: []
        }
      };
    }
  }

  const eligible = eligibleTopics.find((topic) =>
    !coveredTopicKeys.has(`${topic.day}|${topic.topic}`)
  ) || eligibleTopics.find((topic) => Number(topic.day) !== Number(session.curriculumDaysCovered.at(-1)));

  if (!eligible) {
    const repeatTopic = eligibleTopics[primaryCount % Math.max(1, eligibleTopics.length)];
    const repeatText = `Take ${repeatTopic.topic} one level deeper: explain the key trade-offs, failure modes, and how you would validate your approach in production.`;
    return {
      action: "new_topic",
      question: {
        id: randomUUID(), day: Number(repeatTopic.day), topic: repeatTopic.topic, type: "primary",
        difficulty: "intermediate", question: repeatText, text: repeatText
      },
      assessment: lastAnswer ? {
        score: 60, technicalUnderstanding: 60, reasoning: 60, confidence: 60,
        strengths: [], weaknesses: [], missingConcepts: []
      } : null
    };
  }

  const source = fallbackQuestions.find((q) => Number(q.day) === Number(eligible.day) && q.topic === eligible.topic);
  return {
    action: "new_topic",
    question: {
      id: randomUUID(), day: Number(eligible.day), topic: eligible.topic, type: "primary",
      difficulty: "intermediate",
      question: source?.prompt || `Explain the key concepts, trade-offs, and production considerations of ${eligible.topic}.`, text: source?.prompt || `Explain the key concepts, trade-offs, and production considerations of ${eligible.topic}.`
    },
    assessment: lastAnswer ? {
      score: 60, technicalUnderstanding: 60, reasoning: 60, confidence: 60,
      strengths: [], weaknesses: [], missingConcepts: []
    } : null
  };
}

function fallbackFinalFeedback(session) {
  const evaluations = session.evaluations;
  const avg = evaluations.length
    ? Math.round(evaluations.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / evaluations.length)
    : 60;
  const score = Math.min(100, Math.max(0, avg));
  return {
    overallScore: score, technicalKnowledge: score, problemSolving: Math.max(0, score - 2),
    reasoning: Math.min(100, score + 2), communication: Math.min(100, score + 4),
    strengths: ["Explained technical ideas during the adaptive session."],
    weaknesses: ["Continue practicing concise trade-off explanations."],
    topicsToRevise: [...new Set(session.questions.map((q) => q.topic).filter(Boolean))].slice(-3),
    recommendations: ["Review the topics discussed and practice explaining your decisions with clear trade-offs."],
    curriculumCoverage: { days: session.curriculumDaysCovered },
    questionPerformance: evaluations.map((item) => ({ topic: session.questions.find((q) => q.id === item.questionId)?.topic || "Interview topic", score: item.score || score }))
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
    // Fall back to a generated session-specific quote when the AI provider is unavailable.
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
  const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getApiKey()}` }, body: JSON.stringify({ model: MODEL, response_format: { type: "json_object" }, temperature: 0.35, messages: [{ role: "system", content: instruction }, { role: "user", content: JSON.stringify(context) }] }), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Object.assign(new Error("AI interviewer is temporarily unavailable."), { code: "AI_PROVIDER_ERROR" });
  const payload = await response.json();
  try { return JSON.parse(payload.choices?.[0]?.message?.content || ""); } catch { throw Object.assign(new Error("AI interviewer returned an invalid response."), { code: "AI_INVALID_RESPONSE" }); }
}

function validateQuestion(value, eligibleTopics, parentQuestionId = null) {
  const eligibleTopic = eligibleTopics.find((topic) => topic.day === Number(value?.day));
  if (!value || !eligibleTopic || value.topic !== eligibleTopic.topic || typeof value.question !== "string" || !["primary", "follow-up", "clarification", "scenario"].includes(value.type)) return null;
  return { id: value.id || randomUUID(), parentQuestionId, day: Number(value.day), topic: value.topic.trim(), type: value.type, difficulty: ["foundation", "intermediate", "advanced"].includes(value.difficulty) ? value.difficulty : "intermediate", text: value.question.trim() };
}

function validateAssessment(value) {
  if (!value || !Number.isFinite(value.score) || value.score < 0 || value.score > 100) return null;
  return value;
}

export async function generateInterviewResponse({ candidate, eligibleTopics, session, lastAnswer = null }) {
  if (!getApiKey()) return fallbackInterviewResponse({ candidate, eligibleTopics, session, lastAnswer });
  const coveragePolicy = getCoveragePolicy(session, eligibleTopics);
  const instruction = "You are a concise, professional AI technical interviewer. Return JSON only: {action,reason,question:{id,day,topic,type,difficulty,question},assessment:{score,technicalUnderstanding,reasoning,confidence,strengths,weaknesses,missingConcepts}}. Ask one technical question. Use only eligible days. Use lastAnswer and its assessment: strong answers can warrant one deeper follow-up; weak answers can warrant clarification; partial answers target missing concepts. Do not repeat a topic except for a meaningful follow-up. Follow coveragePolicy exactly; when requiresNewDay is true, return action new_topic and a primary question on uncoveredEligibleDays; when mustAskPrimary is true, return a primary question. Never reveal scoring or give answers.";
  const data = await structuredCompletion(instruction, { ...compactContext({ candidate, eligibleTopics, session, lastAnswer }), lastAnswer, coveragePolicy });
  const question = validateQuestion(data.question, eligibleTopics, lastAnswer?.questionId || null);
  if (!question) throw Object.assign(new Error("AI interviewer returned an unusable question."), { code: "AI_INVALID_RESPONSE" });
  if (coveragePolicy.requiresNewDay && (question.type !== "primary" || !coveragePolicy.uncoveredEligibleDays.includes(question.day))) throw Object.assign(new Error("AI interviewer did not satisfy required curriculum coverage."), { code: "AI_INVALID_RESPONSE" });
  if (coveragePolicy.mustAskPrimary && question.type !== "primary") throw Object.assign(new Error("AI interviewer did not continue required primary-question coverage."), { code: "AI_INVALID_RESPONSE" });
  const assessment = lastAnswer ? validateAssessment(data.assessment) : null;
  if (lastAnswer && !assessment) throw Object.assign(new Error("AI interviewer returned an unusable answer evaluation."), { code: "AI_INVALID_RESPONSE" });
  return { question, assessment, action: data.action || "new_topic", coveragePolicy };
}

export async function generateFinalFeedback({ candidate, eligibleTopics, session }) {
  if (!getApiKey()) return fallbackFinalFeedback(session);
  const instruction = "You are an AI interview evaluator. Return JSON only with: overallScore, technicalKnowledge, problemSolving, reasoning, communication, strengths, weaknesses, topicsToRevise, recommendations, curriculumCoverage, questionPerformance. Claims must be grounded in answers. Scores 0-100. Do not reveal private chain-of-thought.";
  const feedback = await structuredCompletion(instruction, { ...compactContext({ candidate, eligibleTopics, session }), answers: session.answers, evaluations: session.evaluations });
  const scoreFields = ["overallScore", "technicalKnowledge", "problemSolving", "reasoning", "communication"];
  if (scoreFields.some((field) => !Number.isFinite(feedback[field]) || feedback[field] < 0 || feedback[field] > 100) || !Array.isArray(feedback.strengths) || !Array.isArray(feedback.weaknesses) || !Array.isArray(feedback.topicsToRevise) || !Array.isArray(feedback.recommendations) || !Array.isArray(feedback.questionPerformance)) throw Object.assign(new Error("AI evaluator returned invalid feedback."), { code: "AI_INVALID_RESPONSE" });
  return feedback;
}

export const aiConfiguration = () => ({ provider: "OpenAI-compatible Chat Completions", model: MODEL, configured: Boolean(getApiKey()) });
