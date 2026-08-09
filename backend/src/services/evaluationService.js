import { randomUUID } from "node:crypto";
import { getCandidateProfile } from "../candidate/profileService.js";
import { buildCandidateInterviewContext } from "../candidate/candidateContextService.js";

const API_URL = (process.env.AI_BASE_URL || "").trim() || "https://api.openai.com/v1/chat/completions";
const MODEL = (process.env.AI_MODEL || "").trim() || "gpt-4o-mini";
const getApiKey = () => (process.env.AI_API_KEY || "").trim();

const competencyDefinitions = [
  { key: "technicalKnowledge", name: "Technical Knowledge" },
  { key: "problemSolving", name: "Problem Solving" },
  { key: "systemDesign", name: "System Design" },
  { key: "productionThinking", name: "Production Thinking" },
  { key: "communication", name: "Communication" },
  { key: "practicalExperience", name: "Practical Experience" }
];

function isMeaningfulNumber(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function buildQuestionAnalysis(session) {
  const questions = session.questions || [];
  const answers = session.answers || [];
  const evaluations = session.evaluations || [];

  return questions.map((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    const evaluation = evaluations.find((item) => item.questionId === question.id);
    const evidenceParts = [];
    if (evaluation?.strengths?.length) evidenceParts.push(...evaluation.strengths);
    if (evaluation?.weaknesses?.length) evidenceParts.push(...evaluation.weaknesses);
    if (evaluation?.missingConcepts?.length) evidenceParts.push(...evaluation.missingConcepts.map((concept) => `Missing concept: ${concept}`));
    if (answer?.text) evidenceParts.push(`Candidate answered: ${answer.text}`);

    const unanswered = !answer?.text?.trim();
    const score = unanswered ? 0 : (isMeaningfulNumber(evaluation?.score) ? Math.round(evaluation.score) : 0);
    const evidenceText = evidenceParts.length
      ? evidenceParts.join(" ")
      : unanswered
        ? "NO_ANSWER: The candidate did not answer this question."
        : `The interview included ${question.topic || "this topic"} but the evidence was not rich enough to generate detailed analysis.`;

    return {
      questionId: question.id,
      topic: question.topic || "Technical Discussion",
      question: question.text || "",
      candidateAnswer: answer?.text || "NO_ANSWER",
      unanswered,
      score,
      strengths: Array.isArray(evaluation?.strengths) ? evaluation.strengths : [],
      weaknesses: Array.isArray(evaluation?.weaknesses) ? evaluation.weaknesses : [],
      missingConcepts: Array.isArray(evaluation?.missingConcepts) ? evaluation.missingConcepts : [],
      agentAction: question.isFollowUp ? "follow_up" : "new_topic",
      evidence: evidenceText
    };
  });
}

function summarizeEvidence(questionAnalysis) {
  return questionAnalysis.flatMap((item) => {
    const evidence = [];
    if (item.evidence) evidence.push(item.evidence);
    if (item.strengths?.length) evidence.push(...item.strengths.map((strength) => `Strength: ${strength}`));
    if (item.weaknesses?.length) evidence.push(...item.weaknesses.map((weakness) => `Weakness: ${weakness}`));
    if (item.missingConcepts?.length) evidence.push(...item.missingConcepts.map((concept) => `Missing concept: ${concept}`));
    return evidence;
  });
}

function buildCompetencies(questionAnalysis, session) {
  const questionCount = questionAnalysis.length;
  const scored = questionAnalysis.filter((item) => Boolean(item.questionId) && !item.unanswered);

  return competencyDefinitions.map((definition) => {
    const values = scored
      .map((item) => {
        const evaluation = (session.evaluations || []).find((entry) => entry.questionId === item.questionId);
        return evaluation?.[definition.key];
      })
      .filter((value) => isMeaningfulNumber(value));

    if (!values.length) {
      return {
        name: definition.name,
        score: null,
        confidence: 0.4,
        evidence: [`Not enough evidence from this interview to reliably score ${definition.name}.`],
        strengths: [],
        weaknesses: [],
        missingConcepts: []
      };
    }

    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    const evidence = summarizeEvidence(questionAnalysis).filter((entry) => entry.toLowerCase().includes(definition.name.toLowerCase()) || entry.toLowerCase().includes(definition.key.toLowerCase()));
    const evidenceText = evidence.length ? evidence.slice(0, 3) : [`The interview included multiple responses that support a ${definition.name.toLowerCase()} assessment.`];

    return {
      name: definition.name,
      score: average,
      confidence: Math.max(0.55, Math.min(0.95, 0.65 + (values.length / Math.max(1, questionCount)) * 0.2)),
      evidence: evidenceText,
      strengths: questionAnalysis.flatMap((item) => {
        const assessment = (session.evaluations || []).find((entry) => entry.questionId === item.questionId);
        return Array.isArray(assessment?.strengths) ? assessment.strengths : [];
      }).slice(0, 3),
      weaknesses: questionAnalysis.flatMap((item) => {
        const assessment = (session.evaluations || []).find((entry) => entry.questionId === item.questionId);
        return Array.isArray(assessment?.weaknesses) ? assessment.weaknesses : [];
      }).slice(0, 3),
      missingConcepts: questionAnalysis.flatMap((item) => {
        const assessment = (session.evaluations || []).find((entry) => entry.questionId === item.questionId);
        return Array.isArray(assessment?.missingConcepts) ? assessment.missingConcepts : [];
      }).slice(0, 3)
    };
  });
}

function buildTopicCoverage(questionAnalysis) {
  const grouped = new Map();
  questionAnalysis.forEach((item) => {
    const topic = item.topic || "Technical Discussion";
    if (!grouped.has(topic)) grouped.set(topic, []);
    grouped.get(topic).push(item);
  });

  return [...grouped.entries()].map(([topic, items]) => ({
    topic,
    count: items.length,
    coveragePercentage: Math.round((items.length / Math.max(1, questionAnalysis.length)) * 100),
    score: Math.round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(1, items.length))
  }));
}

function buildRecommendations(questionAnalysis, competencies) {
  const missing = questionAnalysis.flatMap((item) => item.missingConcepts || []);
  const weaknesses = questionAnalysis.flatMap((item) => item.weaknesses || []);
  const recommendations = [];

  if (missing.length) {
    recommendations.push(`Review ${[...new Set(missing)].slice(0, 2).join(" and ")} before your next interview.`);
  }
  if (weaknesses.length) {
    recommendations.push(`Practice explaining the trade-offs behind ${[...new Set(weaknesses)].slice(0, 2).join(" and ")}.`);
  }

  const lowScoringCompetency = [...competencies].filter((item) => item.score !== null && item.score < 75).sort((a, b) => a.score - b.score)[0];
  if (lowScoringCompetency) {
    recommendations.push(`Strengthen ${lowScoringCompetency.name.toLowerCase()} with a short mock interview and a few timed practice answers.`);
  }

  return recommendations.slice(0, 4);
}

export function buildEvaluationReport(session, candidate) {
  if (!session) return null;
  if (session.status !== "completed") return null;

  const questionAnalysis = buildQuestionAnalysis(session);
  const competencies = buildCompetencies(questionAnalysis, session);
  const scoredCompetencies = competencies.filter((item) => item.score !== null);
  const evidenceScore = scoredCompetencies.length
    ? Math.round(scoredCompetencies.reduce((sum, item) => sum + item.score, 0) / scoredCompetencies.length)
    : 0;
  const totalQuestions = Math.max(session.plannedQuestionCount || 8, questionAnalysis.length);
  const answeredQuestions = questionAnalysis.filter((item) => !item.unanswered).length;
  const unansweredQuestions = Math.max(0, totalQuestions - answeredQuestions);
  const overallScore = Math.round(evidenceScore * (answeredQuestions / totalQuestions));
  const confidence = scoredCompetencies.length
    ? Number((scoredCompetencies.reduce((sum, item) => sum + item.confidence, 0) / scoredCompetencies.length).toFixed(2))
    : 0.68;

  const strengths = [...new Set(questionAnalysis.flatMap((item) => item.strengths).filter(Boolean))].slice(0, 4);
  const weaknesses = [...new Set(questionAnalysis.flatMap((item) => item.weaknesses).filter(Boolean))].slice(0, 4);
  const missingConcepts = [...new Set(questionAnalysis.flatMap((item) => item.missingConcepts).filter(Boolean))].slice(0, 5);
  const recommendations = buildRecommendations(questionAnalysis, competencies);
  const topImprovementAreas = [...new Set(missingConcepts.concat(weaknesses).filter(Boolean))].slice(0, 4);

  const evaluation = {
    overallScore,
    confidence,
    competencies,
    strengths,
    weaknesses,
    topImprovementAreas,
    questionAnalysis,
    topicCoverage: buildTopicCoverage(questionAnalysis),
    recommendations,
    summary: `The candidate answered ${answeredQuestions} of ${totalQuestions} planned interview questions; ${unansweredQuestions} question${unansweredQuestions === 1 ? " was" : "s were"} unanswered.`,
    questionsAnswered: answeredQuestions,
    questionsUnanswered: unansweredQuestions,
    totalQuestions,
    domain: session.domain || "Backend Development",
    difficulty: session.difficulty || "Advanced",
    candidateProfile: buildCandidateInterviewContext(candidate) || {
      id: session.candidateId,
      name: session.candidateId,
      completedTopics: [],
      skippedTopics: [],
      attempts: {},
      learningSignals: {},
      strengths: [],
      weakAreas: []
    }
  };

  return evaluation;
}

export function buildLegacyFeedback(evaluation, session) {
  if (!evaluation) return null;
  const competencyMap = Object.fromEntries((evaluation.competencies || []).map((item) => [item.name, item]));
  const scoreFor = (name, fallback = evaluation.overallScore) => {
    const competency = competencyMap[name];
    return competency?.score ?? fallback;
  };

  const topicBreakdown = (evaluation.topicCoverage || []).map((item) => ({
    topic: item.topic,
    count: item.count,
    coveragePercentage: item.coveragePercentage,
    performanceScore: item.score
  }));

  const focusedAreas = (evaluation.topImprovementAreas || []).map((topic, index) => ({
    step: String(index + 1).padStart(2, "0"),
    topic,
    why: `This area surfaced during the interview as a gap that affected the candidate's evidence quality.`,
    evidence: evaluation.recommendations[index] || `Review the related concepts from the interview transcript.`,
    whatToLearn: `Study the core concepts behind ${topic}.`,
    whatToPractice: `Practice explaining ${topic} with an example and concrete trade-offs.`
  }));

  return {
    domain: evaluation.domain || session.domain || "Backend Development",
    difficulty: evaluation.difficulty || session.difficulty || "Advanced",
    overallScore: evaluation.overallScore,
    overall: evaluation.overallScore,
    technicalKnowledge: scoreFor("Technical Knowledge"),
    technical: scoreFor("Technical Knowledge"),
    problemSolving: scoreFor("Problem Solving"),
    systemDesign: scoreFor("System Design"),
    productionThinking: scoreFor("Production Thinking"),
    production: scoreFor("Production Thinking"),
    communication: scoreFor("Communication"),
    practicalExperience: scoreFor("Practical Experience"),
    scoreExplanation: `The overall score reflects evidence from ${evaluation.questionAnalysis?.length || 0} answered questions and the candidate’s demonstrated reasoning during the interview.`,
    summary: evaluation.summary,
    strengths: evaluation.strengths || [],
    weaknesses: evaluation.weaknesses || [],
    topicsToRevise: evaluation.topImprovementAreas || [],
    recommendations: evaluation.recommendations || [],
    focusedAreas,
    topicBreakdown,
    questionPerformance: topicBreakdown.map((item) => ({ topic: item.topic, score: item.performanceScore })),
    curriculumCoverage: {
      daysCovered: session.curriculumDaysCovered || [],
      count: (session.curriculumDaysCovered || []).length
    },
    questionsAnswered: evaluation.questionsAnswered,
    questionsUnanswered: evaluation.questionsUnanswered,
    totalQuestions: evaluation.totalQuestions,
    questionsAsked: session.questions?.length || 0,
    followUpsAsked: session.followUpCount || 0,
    evaluation
  };
}

export function buildEvaluationChatContext(session, candidate, evaluation, history = []) {
  const candidateProfile = buildCandidateInterviewContext(candidate) || {
    id: session.candidateId,
    name: session.candidateId,
    completedTopics: [],
    skippedTopics: [],
    attempts: {},
    learningSignals: {},
    strengths: [],
    weakAreas: []
  };
  const questionAnalysis = evaluation?.questionAnalysis || [];
  return {
    candidateProfile,
    evaluation,
    messageHistory: history.slice(-6),
    interviewSummary: {
      totalQuestions: questionAnalysis.length,
      strengths: evaluation?.strengths || [],
      weaknesses: evaluation?.weaknesses || [],
      recommendations: evaluation?.recommendations || [],
      topicCoverage: evaluation?.topicCoverage || []
    },
    questionAnalysis,
    sessionSummary: {
      domain: session.domain || "Backend Development",
      difficulty: session.difficulty || "Advanced",
      completedAt: session.completedAt || null,
      topicsCovered: session.topicsCovered || []
    }
  };
}

function looksLikeTopicMention(message, topicName) {
  const lower = message.toLowerCase();
  return lower.includes(topicName.toLowerCase());
}

function buildFallbackChatReply(message, context) {
  const lower = (message || "").toLowerCase();
  const evaluation = context.evaluation || {};
  const questionAnalysis = evaluation.questionAnalysis || [];
  const competencies = evaluation.competencies || [];
  const overallScore = evaluation.overallScore ?? 72;

  const competencyMatch = competencies.find((item) => looksLikeTopicMention(message, item.name));
  const topicMatch = questionAnalysis.find((item) => looksLikeTopicMention(message, item.topic || "") || looksLikeTopicMention(message, item.question || ""));

  if (lower.includes("strongest") || lower.includes("best answer")) {
    const strongest = questionAnalysis.slice().sort((a, b) => b.score - a.score)[0];
    const answer = strongest
      ? `Your strongest answer was on ${strongest.topic} because it demonstrated clear reasoning and practical trade-offs. The evidence was: ${strongest.evidence}.`
      : "I don't have enough evidence from this interview to identify a strongest answer.";
    return { answer, sources: strongest ? [{ questionId: strongest.questionId, topic: strongest.topic }] : [] };
  }

  if (lower.includes("weakest") || lower.includes("hurt my score") || lower.includes("which answer hurt")) {
    const weakest = questionAnalysis.slice().sort((a, b) => a.score - b.score)[0];
    const answer = weakest
      ? `The weakest answer was on ${weakest.topic}; it showed gaps around ${weakest.missingConcepts?.join(", ") || "the core concepts"}.`
      : "I don't have enough evidence from this interview to identify the weakest answer.";
    return { answer, sources: weakest ? [{ questionId: weakest.questionId, topic: weakest.topic }] : [] };
  }

  if (lower.includes("what should i improve") || lower.includes("study next") || lower.includes("improve") || lower.includes("what should i study")) {
    const recommendation = (evaluation.recommendations || [])[0] || "Practice communicating trade-offs and technical mechanisms with concrete examples.";
    return { answer: recommendation, sources: questionAnalysis.slice(0, 2).map((item) => ({ questionId: item.questionId, topic: item.topic })) };
  }

  if (competencyMatch && competencyMatch.score !== null) {
    return {
      answer: `${competencyMatch.name} scored ${competencyMatch.score}/100. Evidence from the interview includes: ${competencyMatch.evidence.join(" ")}.`,
      sources: questionAnalysis.slice(0, 2).map((item) => ({ questionId: item.questionId, topic: item.topic }))
    };
  }

  if (competencyMatch && competencyMatch.score === null) {
    return {
      answer: `I don't have enough evidence from this interview to reliably score your ${competencyMatch.name.toLowerCase()} knowledge.`,
      sources: []
    };
  }

  if (topicMatch) {
    return {
      answer: `Your answer on ${topicMatch.topic} was scored ${topicMatch.score}/100. The strongest evidence was: ${topicMatch.evidence}.`,
      sources: [{ questionId: topicMatch.questionId, topic: topicMatch.topic }]
    };
  }

  return {
    answer: `Your overall score was ${overallScore}/100. The interview evidence showed ${evaluation.strengths?.[0] || "clear reasoning"} and pointed to ${evaluation.topImprovementAreas?.[0] || "a few follow-up areas"} as the main improvement areas.`,
    sources: questionAnalysis.slice(0, 2).map((item) => ({ questionId: item.questionId, topic: item.topic }))
  };
}

async function requestChatCompletion(systemInstruction, context) {
  if (!getApiKey()) throw Object.assign(new Error("AI evaluation chatbot is not configured."), { code: "AI_NOT_CONFIGURED" });
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getApiKey()}` },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.25,
      messages: [{ role: "system", content: systemInstruction }, { role: "user", content: JSON.stringify(context) }]
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw Object.assign(new Error("AI evaluation chatbot is temporarily unavailable."), { code: "AI_PROVIDER_ERROR" });
  const payload = await response.json();
  try {
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    return {
      answer: typeof parsed.answer === "string" && parsed.answer.trim() ? parsed.answer.trim() : "I don't have enough evidence from this interview to answer that reliably.",
      sources: Array.isArray(parsed.sources) ? parsed.sources : []
    };
  } catch {
    throw Object.assign(new Error("AI evaluation chatbot returned an invalid response."), { code: "AI_INVALID_RESPONSE" });
  }
}

export async function generateEvaluationChatReply({ session, candidate, evaluation, message, history = [] }) {
  if (!session || session.status !== "completed") {
    throw Object.assign(new Error("Interview is not completed"), { code: "INTERVIEW_NOT_COMPLETED" });
  }

  const context = buildEvaluationChatContext(session, candidate, evaluation, history);
  const systemInstruction = `You are an AI Interview Evaluation & Coaching Assistant. Reason strictly from the provided interview record. You may explain scores, strengths, weaknesses, missing concepts, and recommend study steps. You must not invent interview answers, scores, or evidence. If the evidence is insufficient, say so clearly. Keep your response concise and useful. Return JSON ONLY with {"answer":"...","sources":[{"questionId":"...","topic":"..."}]}`;

  try {
    const reply = await requestChatCompletion(systemInstruction, context);
    return {
      answer: reply.answer,
      sources: reply.sources.filter((source) => source?.questionId || source?.topic).slice(0, 4)
    };
  } catch (error) {
    if (error?.code === "AI_INVALID_RESPONSE") {
      return buildFallbackChatReply(message, context);
    }
    return buildFallbackChatReply(message, context);
  }
}

export function validateEvaluationOwnership(session, candidateId) {
  if (!session) return { allowed: false, reason: "Session not found" };
  if (session.status !== "completed") return { allowed: false, reason: "Interview is not completed" };
  const expectedCandidateId = (session.candidateId || "").toLowerCase();
  const providedCandidateId = String(candidateId || "").toLowerCase();
  if (!providedCandidateId || expectedCandidateId !== providedCandidateId) {
    return { allowed: false, reason: "Access denied" };
  }

  return { allowed: true };
}

export function getCandidateContext(candidateId) {
  const candidate = getCandidateProfile(candidateId);
  return candidate || { member: { id: candidateId, name: "Candidate", jobRole: "AI Engineer" } };
}
