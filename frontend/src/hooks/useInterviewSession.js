import { useEffect, useMemo, useRef, useState } from "react";
import { getCoverage } from "../services/interview/questionPlanner";
import { buildTopicTimeline, createInitialInterviewState, normalizeAnswer } from "../utils/interviewState";
import { completeInterviewSession, startInterviewSession, submitAnswerToSession } from "../services/interviewService";

const toQuestion = (question) => ({
  id: question.id,
  day: question.curriculumDay ?? question.day,
  topic: question.topic,
  type: question.type,
  difficulty: question.difficulty,
  question: question.text,
  parentQuestionId: question.parentQuestionId
});

const toResults = (feedback) => ({
  overall: feedback.overallScore,
  technical: feedback.technicalKnowledge,
  problemSolving: feedback.problemSolving,
  reasoning: feedback.reasoning,
  communication: feedback.communication,
  systemDesign: feedback.reasoning,
  production: feedback.technicalKnowledge,
  strengths: feedback.strengths || [],
  weaknesses: feedback.weaknesses || [],
  topicsToRevise: feedback.topicsToRevise || [],
  recommendation: (feedback.recommendations || []).join(" "),
  topicScores: (feedback.questionPerformance || []).map((item) => [item.topic || "Interview topic", item.score || 0]),
  source: "live"
});

export function useInterviewSession(candidate) {
  const initialSession = useMemo(() => createInitialInterviewState(candidate), [candidate]);
  const [sessionState, setSessionState] = useState(initialSession);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState(null);
  const [aiMode, setAiMode] = useState("connecting");
  const [results, setResults] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const [error, setError] = useState("");
  const submissionInFlight = useRef(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    startInterviewSession(candidate.originalId || candidate.id).then((response) => {
      if (!active) return;
      setAiSessionId(response.sessionId); setAiMode("live"); setError("");
      const question = toQuestion(response.question);
      setSessionState(createInitialInterviewState(candidate, question));
    }).catch((requestError) => {
      if (!active) return;
      setAiMode("error");
      setError(requestError.message || "Unable to start the interview. Check the backend connection and try again.");
      setSessionState((existing) => ({ ...existing, interviewStatus: "error" }));
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [candidate]);

  const messages = sessionState.conversationHistory.map((message) => ({ id: `${message.order}-${message.questionId || "answer"}`, role: message.role === "interviewer" ? "ai" : "candidate", text: message.content, topic: message.topic, day: message.day, adaptive: message.questionType === "follow-up" }));
  const currentPrimaryCount = sessionState.questionsAsked.filter((question) => question.type === "primary").length;
  const submitAnswer = async (answer) => {
    const content = normalizeAnswer(answer);
    const currentQuestion = sessionState.currentQuestion;
    if (!content || !currentQuestion || isLoading || submissionInFlight.current || !aiSessionId || sessionState.completionState) return;
    submissionInFlight.current = true;
    setIsLoading(true);
    setError("");
    try {
      const response = await submitAnswerToSession(aiSessionId, currentQuestion.id, content);
      const storedAnswer = { questionId: currentQuestion.id, answer: content, createdAt: new Date().toISOString(), quality: "ai-evaluated" };
      if (response.completed) {
        setFeedbackStatus("loading");
        const evaluation = await completeInterviewSession(aiSessionId);
        setResults(toResults(evaluation.feedback));
        setFeedbackStatus("ready");
        setSessionState((existing) => ({ ...existing, answers: [...existing.answers, storedAnswer], interviewStatus: "complete", completionState: true }));
        return;
      }
      const next = toQuestion(response.question);
      setSessionState((existing) => ({ ...existing, answers: [...existing.answers, storedAnswer], currentQuestion: next, currentTopic: next.topic, currentQuestionNumber: existing.currentQuestionNumber + (next.type === "primary" ? 1 : 0), questionsAsked: next.type === "primary" ? [...existing.questionsAsked, next] : existing.questionsAsked, coveredDays: next.type === "primary" ? [...new Set([...existing.coveredDays, next.day])] : existing.coveredDays, followUpCount: existing.followUpCount + (next.type !== "primary" ? 1 : 0), conversationHistory: [...existing.conversationHistory, { role: "candidate", content, questionId: currentQuestion.id, order: existing.conversationHistory.length + 1 }, { role: "interviewer", content: next.question, questionId: next.id, parentQuestionId: next.parentQuestionId, questionType: next.type, day: next.day, topic: next.topic, order: existing.conversationHistory.length + 2 }] }));
    } catch (requestError) {
      setError(requestError.message || "Unable to submit the answer. Your answer was not accepted; please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsLoading(false);
    }
  };

  const coverage = getCoverage(sessionState);
  const topics = useMemo(() => buildTopicTimeline(sessionState.questionsAsked.filter((question) => question.type === "primary"), currentPrimaryCount), [sessionState.questionsAsked, currentPrimaryCount]);
  return { candidate, messages, questionNumber: currentPrimaryCount, totalQuestions: 8, topics, isLoading, results, feedbackStatus, answered: sessionState.answers, followUpShown: false, followUpCount: sessionState.followUpCount, sessionState: { ...sessionState, error }, coveredDays: coverage.curriculumDaysCovered, coverage, aiMode, submitAnswer };
}
