import express from "express";
import { getCandidateProfile } from "../candidate/profileService.js";
import { analyzeCandidateCurriculum } from "../analysis/eligibleTopicService.js";
import { addAnswerToSession, createInterviewSession, finalizeSession, getInterviewSession, interviewSessionService } from "../services/interviewService.js";
import { addEvaluationToSession, addQuestionToSession } from "../services/interviewService.js";
import { aiConfiguration, generateFinalFeedback, generateInterviewQuote, generateInterviewResponse } from "../services/aiInterviewerService.js";

function sendAiError(res, error) {
  const status = error.code === "AI_NOT_CONFIGURED" ? 503 : error.code === "AI_INVALID_RESPONSE" ? 502 : 503;
  return res.status(status).json({ error: error.message, code: error.code || "AI_ERROR", retryable: true });
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
  const candidate = getCandidateProfile(candidateId);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  try {
    const quote = await generateInterviewQuote({ candidate });
    return res.json({ quote });
  } catch (error) {
    return sendAiError(res, error);
  }
});

router.post("/start", async (req, res) => {
  const { candidateId } = req.body || {};
  const candidate = getCandidateProfile(candidateId);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  const eligibleTopics = analyzeCandidateCurriculum(candidate.member.id)?.eligibleTopics || [];
  const eligibleDayCount = new Set(eligibleTopics.map((topic) => topic.day)).size;
  if (eligibleDayCount < 4) return res.status(422).json({ error: `This candidate has completed curriculum topics on only ${eligibleDayCount} eligible day(s). At least 4 are required to run a full interview.`, code: "INSUFFICIENT_CURRICULUM_COVERAGE" });
  const session = createInterviewSession(candidateId);
  interviewSessionService.activateSession(session.sessionId);
  try {
    const response = await generateInterviewResponse({ candidate, eligibleTopics, session });
    const question = addQuestionToSession(session.sessionId, { ...response.question, text: response.question.text, curriculumDay: response.question.day, isFollowUp: false });
    return res.status(201).json({ sessionId: session.sessionId, candidateId, candidateProfile: { id: candidate.member.id, name: candidate.member.name }, question, provider: aiConfiguration() });
  } catch (error) { return sendAiError(res, error); }
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
  const candidate = getCandidateProfile(session.candidateId);
  const eligibleTopics = candidate ? analyzeCandidateCurriculum(candidate.member.id)?.eligibleTopics || [] : [];
  const activeSession = getInterviewSession(sessionId);
  const primaryAnsweredQuestionCount = activeSession.questions.filter((question) => !question.isFollowUp).length;
  if (primaryAnsweredQuestionCount >= 8 && activeSession.curriculumDaysCovered.length >= 4) {
    const storedAnswer = addAnswerToSession(sessionId, { questionId, answer: answer.trim() });
    return res.json({ accepted: Boolean(storedAnswer), answerCount: activeSession.answers.length, completed: true });
  }

  try {
    // Generate the next question before persisting the answer. If the AI provider
    // fails, the candidate can safely retry instead of receiving a duplicate-answer error.
    const response = await generateInterviewResponse({
      candidate,
      eligibleTopics,
      session: getInterviewSession(sessionId),
      lastAnswer: { questionId, answer: answer.trim() }
    });
    const storedAnswer = addAnswerToSession(sessionId, { questionId, answer: answer.trim() });
    if (!storedAnswer) return res.status(404).json({ error: "Session not found" });
    const question = addQuestionToSession(sessionId, {
      ...response.question,
      text: response.question.text,
      curriculumDay: response.question.day,
      isFollowUp: response.question.type !== "primary"
    });
    if (response.assessment) addEvaluationToSession(sessionId, { questionId, ...response.assessment });
    return res.json({ accepted: true, answerCount: getInterviewSession(sessionId).answers.length, question, action: response.action });
  } catch (error) { return sendAiError(res, error); }
});

router.post("/feedback", async (req, res) => {
  const { sessionId } = req.body || {};
  const session = getInterviewSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (session.questions.filter((question) => !question.isFollowUp).length < 8 || session.curriculumDaysCovered.length < 4) return res.status(422).json({ error: "Interview must cover at least 8 primary questions across 4 curriculum days." });
  const candidate = getCandidateProfile(session.candidateId);
  const eligibleTopics = candidate ? analyzeCandidateCurriculum(candidate.member.id)?.eligibleTopics || [] : [];
  try {
    const feedback = await generateFinalFeedback({ candidate, eligibleTopics, session });
    return res.json({ sessionId, feedback });
  } catch (error) { return sendAiError(res, error); }
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
