import express from "express";
import { getCandidateProfile } from "../candidate/profileService.js";
import { analyzeCandidateCurriculum } from "../analysis/eligibleTopicService.js";
import { addAnswerToSession, createInterviewSession, finalizeSession, getInterviewSession, interviewSessionService } from "../services/interviewService.js";
import { addEvaluationToSession, addQuestionToSession } from "../services/interviewService.js";
import { aiConfiguration, generateFinalFeedback, generateInterviewQuote, generateInterviewResponse } from "../services/aiInterviewerService.js";
import { buildEvaluationReport, buildLegacyFeedback, generateEvaluationChatReply, getCandidateContext, validateEvaluationOwnership } from "../services/evaluationService.js";

function sendAiError(res, error) {
  const status = error.code === "AI_NOT_CONFIGURED" ? 503 : error.code === "AI_INVALID_RESPONSE" ? 502 : 503;
  return res.status(status).json({ error: error.message || "AI service error", code: error.code || "AI_ERROR", retryable: true });
}

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ai-interview-agent-backend" });
});

router.get("/candidates/:candidateId/analysis", (req, res) => {
  const analysis = analyzeCandidateCurriculum(req.params.candidateId);
  if (!analysis) return res.status(404).json({ error: "Candidate not found" });
  return res.json(analysis);
});

router.get("/provider", (_req, res) => res.json(aiConfiguration()));

router.post("/quote", async (req, res) => {
  const { candidateId } = req.body || {};
  const candidate = getCandidateProfile(candidateId) || { member: { id: candidateId || "CAND-001", name: "Candidate", jobRole: "AI Engineer" } };
  try {
    const quote = await generateInterviewQuote({ candidate });
    return res.json({ quote });
  } catch (error) {
    return sendAiError(res, error);
  }
});

router.post("/start", async (req, res) => {
  const { candidateId, domain, difficulty, role, experienceLevel } = req.body || {};
  const candidate = getCandidateProfile(candidateId) || { member: { id: candidateId || "CAND-001", name: "Candidate", jobRole: "AI Engineer" } };
  let eligibleTopics = analyzeCandidateCurriculum(candidate.member?.id)?.eligibleTopics || [];
  
  // Fallback eligible topics if candidate profile doesn't have 4 documented days
  if (!eligibleTopics.length) {
    eligibleTopics = [
      { day: 1, topic: "AI Fundamentals & Prompt Engineering", module: "Foundation", completed: true },
      { day: 7, topic: "Embeddings & Vector Databases", module: "RAG & Vector Search", completed: true },
      { day: 10, topic: "Retrieval & Matching Engine", module: "RAG & Vector Search", completed: true },
      { day: 14, topic: "LLM Fine-Tuning & Evaluation", module: "Advanced AI", completed: true },
      { day: 20, topic: "Production AI Architecture & Observability", module: "Production Systems", completed: true }
    ];
  }

  const session = createInterviewSession(candidate.member?.id || candidateId, domain, difficulty, role, experienceLevel);
  interviewSessionService.activateSession(session.sessionId);
  try {
    const response = await generateInterviewResponse({ candidate, eligibleTopics, session });
    const question = addQuestionToSession(session.sessionId, { ...response.question, text: response.question.text, curriculumDay: response.question.day, isFollowUp: false });
    return res.status(201).json({
      sessionId: session.sessionId,
      candidateId: session.candidateId,
      domain: session.domain,
      difficulty: session.difficulty,
      role: session.role || role || candidate.member.jobRole,
      experienceLevel: session.experienceLevel || experienceLevel || null,
      candidateProfile: { id: candidate.member.id, name: candidate.member.name, role: candidate.member.jobRole },
      question,
      provider: aiConfiguration()
    });
  } catch (error) {
    return sendAiError(res, error);
  }
});

router.get("/:sessionId", (req, res) => {
  const session = getInterviewSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const candidate = getCandidateProfile(session.candidateId) || { member: { id: session.candidateId, name: "Candidate", jobRole: "AI Engineer" } };
  return res.json({
    sessionId: session.sessionId,
    candidateId: session.candidateId,
    domain: session.domain || "Backend Development",
    difficulty: session.difficulty || "Advanced",
    role: session.role || null,
    experienceLevel: session.experienceLevel || null,
    candidateProfile: { id: candidate.member.id, name: candidate.member.name, role: candidate.member.jobRole },
    status: session.status,
    phase: session.phase,
    currentQuestion: session.currentQuestion,
    currentTopic: session.currentTopic,
    questionCount: session.questions.length,
    followUpCount: session.followUpCount,
    conversationHistory: session.conversationHistory,
    questions: session.questions,
    answers: session.answers,
    skills: session.skills,
    candidateSignals: session.candidateSignals
  });
});

router.post("/answer", async (req, res) => {
  const { sessionId, questionId, answer } = req.body || {};
  if (!sessionId || !questionId || !answer?.trim()) {
    return res.status(400).json({ error: "sessionId, questionId and answer are required" });
  }

  const session = getInterviewSession(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.answers.some((storedAnswer) => storedAnswer.questionId === questionId)) {
    return res.status(409).json({ error: "This question has already been answered." });
  }

  const candidate = getCandidateProfile(session.candidateId) || { member: { id: session.candidateId, name: "Candidate", jobRole: "AI Engineer" } };
  let eligibleTopics = analyzeCandidateCurriculum(candidate.member?.id)?.eligibleTopics || [];
  if (!eligibleTopics.length) {
    eligibleTopics = [
      { day: 1, topic: "AI Fundamentals & Prompt Engineering", module: "Foundation", completed: true },
      { day: 7, topic: "Embeddings & Vector Databases", module: "RAG & Vector Search", completed: true },
      { day: 10, topic: "Retrieval & Matching Engine", module: "RAG & Vector Search", completed: true },
      { day: 14, topic: "LLM Fine-Tuning & Evaluation", module: "Advanced AI", completed: true }
    ];
  }

  const totalQuestionsAsked = session.questions.length;
  const uniqueCurriculumDaysCovered = new Set(session.curriculumDaysCovered || []).size;

  // The interview completes ONLY when totalQuestionsAsked >= 8 AND uniqueCurriculumDaysCovered >= 4
  if (totalQuestionsAsked >= 8 && uniqueCurriculumDaysCovered >= 4) {
    const storedAnswer = addAnswerToSession(sessionId, { questionId, answer: answer.trim() });
    interviewSessionService.completeSession(sessionId);
    return res.json({ accepted: Boolean(storedAnswer), answerCount: session.answers.length, completed: true });
  }

  try {
    const response = await generateInterviewResponse({
      candidate,
      eligibleTopics,
      session,
      lastAnswer: { questionId, answer: answer.trim() }
    });

    const storedAnswer = addAnswerToSession(sessionId, { questionId, answer: answer.trim() });
    if (!storedAnswer) return res.status(404).json({ error: "Session not found" });

    if (response.extractedSignals) {
      interviewSessionService.updateSessionState(sessionId, {
        phase: response.phase,
        difficulty: response.difficulty,
        candidateSignals: response.extractedSignals
      });
    }

    const question = addQuestionToSession(sessionId, {
      ...response.question,
      text: response.question.text,
      curriculumDay: response.question.day,
      isFollowUp: response.question.type !== "primary" && response.question.type !== "WARMUP"
    });

    if (response.assessment) {
      addEvaluationToSession(sessionId, { questionId, ...response.assessment });
    }

    return res.json({
      accepted: true,
      answerCount: getInterviewSession(sessionId).answers.length,
      question,
      action: response.action,
      completed: false
    });
  } catch (error) {
    return sendAiError(res, error);
  }
});

router.all(["/feedback", "/:sessionId/feedback"], async (req, res) => {
  const sessionId = req.params.sessionId || req.body?.sessionId || req.query?.sessionId;
  const session = getInterviewSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.status !== "completed") {
    return res.status(400).json({ error: "Interview is not completed" });
  }

  const candidate = getCandidateContext(session.candidateId);
  const eligibleTopics = analyzeCandidateCurriculum(candidate.member?.id)?.eligibleTopics || [];
  try {
    const feedback = await generateFinalFeedback({ candidate, eligibleTopics, session });
    const evaluation = buildEvaluationReport(session, candidate);
    const legacyFeedback = buildLegacyFeedback(evaluation, session);
    const payload = {
      sessionId,
      feedback: {
        ...feedback,
        ...legacyFeedback,
        evaluation
      }
    };
    return res.json(payload);
  } catch (error) {
    return sendAiError(res, error);
  }
});

router.all(["/:sessionId/evaluation"], (req, res) => {
  const session = getInterviewSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const candidate = getCandidateContext(session.candidateId);
  const evaluation = buildEvaluationReport(session, candidate);
  if (!evaluation) return res.status(400).json({ error: "Interview is not completed" });
  return res.json({ sessionId: session.sessionId, evaluation });
});

router.post("/:sessionId/evaluation/chat", async (req, res) => {
  const session = getInterviewSession(req.params.sessionId);
  const candidateId = req.body?.candidateId || req.query?.candidateId;
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (!session || session.status !== "completed") return res.status(400).json({ error: "Interview is not completed" });

  const ownership = validateEvaluationOwnership(session, candidateId);
  if (!ownership.allowed) {
    return res.status(403).json({ error: ownership.reason || "Access denied" });
  }

  const candidate = getCandidateContext(session.candidateId);
  const evaluation = buildEvaluationReport(session, candidate);
  if (!evaluation) return res.status(400).json({ error: "Interview is not completed" });

  try {
    const reply = await generateEvaluationChatReply({
      session,
      candidate,
      evaluation,
      message: req.body?.message || "",
      history: Array.isArray(req.body?.history) ? req.body.history : []
    });
    return res.json(reply);
  } catch (error) {
    return sendAiError(res, error);
  }
});

router.post("/finish", (req, res) => {
  const { sessionId } = req.body || {};
  const session = finalizeSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({ ok: true, sessionId, interviewStatus: session.status });
});

export default router;

