import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getCoverage } from "../services/interview/questionPlanner";
import { buildTopicTimeline, createInitialInterviewState, normalizeAnswer } from "../utils/interviewState";
import { completeInterviewSession, fetchInterviewSession, startInterviewSession, submitAnswerToSession } from "../services/interviewService";

const toQuestion = (question) => ({
  id: question.id || question.questionId,
  day: question.curriculumDay ?? question.day ?? 1,
  topic: question.topic || "Technical Assessment",
  type: question.type || "primary",
  difficulty: question.difficulty || "intermediate",
  question: question.text || question.question || "",
  parentQuestionId: question.parentQuestionId || null
});

const toResults = (feedback = {}) => ({
  overall: feedback.overallScore ?? 75,
  technical: feedback.technicalKnowledge ?? 75,
  problemSolving: feedback.problemSolving ?? 75,
  systemDesign: feedback.systemDesign ?? 75,
  production: feedback.productionThinking ?? 75,
  communication: feedback.communication ?? 80,
  practicalExperience: feedback.practicalExperience ?? 75,
  scoreExplanation: feedback.scoreExplanation || "",
  domain: feedback.domain || localStorage.getItem("selectedDomain") || "Backend Development",
  difficulty: feedback.difficulty || localStorage.getItem("selectedDifficulty") || "Advanced",
  strengths: feedback.strengths || [],
  weaknesses: feedback.weaknesses || [],
  summary: feedback.summary || "",
  topicsToRevise: feedback.topicsToRevise || [],
  recommendations: feedback.recommendations || [],
  focusedAreas: feedback.focusedAreas || [],
  topicBreakdown: feedback.topicBreakdown || [],
  recommendation: feedback.summary || (feedback.recommendations || []).join(" "),
  topicScores: (feedback.questionPerformance || []).map((item) => [item.topic || "Interview topic", item.score || 0]),
  curriculumCoverage: feedback.curriculumCoverage || { daysCovered: [], count: 0 },
  questionsAsked: feedback.questionsAsked || 0,
  followUpsAsked: feedback.followUpsAsked || 0,
  source: "live"
});

export function useInterviewSession(candidate, explicitSessionId = null) {
  const initialSession = useMemo(() => createInitialInterviewState(candidate), [candidate]);
  const [sessionState, setSessionState] = useState(initialSession);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSessionId, setAiSessionId] = useState(explicitSessionId || localStorage.getItem("activeSessionId") || null);
  const [aiMode, setAiMode] = useState("connecting"); // connecting | live | error
  const [statusState, setStatusState] = useState("INITIALIZING"); // INITIALIZING | STARTING | QUESTION_READY | SUBMITTING_ANSWER | GENERATING_NEXT_QUESTION | COMPLETED | RESULTS | ERROR
  const [results, setResults] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState("");
  const submissionInFlight = useRef(false);

  const initSession = useCallback(async () => {
    let active = true;
    setIsLoading(true);
    setError("");

    const targetSessionId = explicitSessionId || localStorage.getItem("activeSessionId");

    try {
      if (targetSessionId) {
        // Attempt session recovery
        setStatusState("INITIALIZING");
        const existingSession = await fetchInterviewSession(targetSessionId);
        if (!active) return;

        setAiSessionId(existingSession.sessionId);
        localStorage.setItem("activeSessionId", existingSession.sessionId);
        setAiMode("live");

        const qAsked = (existingSession.questions || []).map(toQuestion);
        const currentQ = existingSession.currentQuestion ? toQuestion(existingSession.currentQuestion) : qAsked.at(-1) || null;

        setSessionState((prev) => ({
          ...prev,
          sessionId: existingSession.sessionId,
          currentQuestion: currentQ,
          currentTopic: currentQ?.topic || "Technical Assessment",
          currentQuestionNumber: qAsked.length || 1,
          questionsAsked: qAsked,
          answers: existingSession.answers || [],
          conversationHistory: existingSession.conversationHistory || [],
          coveredDays: [...new Set(qAsked.map((q) => q.day))],
          interviewStatus: existingSession.status === "completed" ? "complete" : "active",
          completionState: existingSession.status === "completed"
        }));

        if (existingSession.status === "completed") {
          setStatusState("COMPLETED");
          fetchFeedback(existingSession.sessionId);
        } else {
          setStatusState("QUESTION_READY");
        }
      } else {
        // Start brand new session
        setStatusState("STARTING");
        const candidateId = candidate?.originalId || candidate?.id || "CAND-001";
        const domain = localStorage.getItem("selectedDomain") || "Backend Development";
        const difficulty = localStorage.getItem("selectedDifficulty") || "Advanced";
        const response = await startInterviewSession(candidateId, domain, difficulty);
        if (!active) return;

        setAiSessionId(response.sessionId);
        localStorage.setItem("activeSessionId", response.sessionId);
        setAiMode("live");

        const question = toQuestion(response.question);
        setSessionState({
          ...createInitialInterviewState(candidate, question),
          domain: response.domain || domain,
          difficulty: response.difficulty || difficulty
        });
        setStatusState("QUESTION_READY");
      }
    } catch (err) {
      if (!active) return;
      setAiMode("error");
      setStatusState("ERROR");
      setError(err.message || "Unable to connect to the interviewer. Check backend status.");
      setSessionState((existing) => ({ ...existing, interviewStatus: "error" }));
    } finally {
      if (active) setIsLoading(false);
    }
  }, [candidate, explicitSessionId]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const fetchFeedback = async (sessionIdToFetch) => {
    try {
      setFeedbackStatus("loading");
      const sid = sessionIdToFetch || aiSessionId;
      const evaluation = await completeInterviewSession(sid);
      setResults(toResults(evaluation.feedback));
      setFeedbackStatus("ready");
      setStatusState("RESULTS");
    } catch (err) {
      setFeedbackStatus("error");
      setError(err.message || "Failed to generate final interview report.");
    }
  };

  const messages = (sessionState.conversationHistory || []).map((message) => ({
    id: `${message.order}-${message.questionId || "answer"}`,
    role: message.role === "interviewer" ? "ai" : "candidate",
    text: message.content,
    topic: message.topic,
    day: message.day,
    adaptive: message.questionType === "follow-up" || message.questionType === "clarification"
  }));

  const allQuestionsAsked = sessionState.questionsAsked || [];
  const currentTotalQuestionCount = allQuestionsAsked.length || 1;

  const submitAnswer = async (answerText) => {
    const content = normalizeAnswer(answerText);
    const currentQuestion = sessionState.currentQuestion;
    if (!content || !currentQuestion || isLoading || submissionInFlight.current || !aiSessionId || sessionState.completionState) return;

    submissionInFlight.current = true;
    setIsLoading(true);
    setStatusState("SUBMITTING_ANSWER");
    setError("");

    try {
      const response = await submitAnswerToSession(aiSessionId, currentQuestion.id, content);
      const storedAnswer = { questionId: currentQuestion.id, answer: content, createdAt: new Date().toISOString() };

      if (response.completed) {
        setSessionState((existing) => ({
          ...existing,
          answers: [...existing.answers, storedAnswer],
          interviewStatus: "complete",
          completionState: true
        }));
        setStatusState("COMPLETED");
        await fetchFeedback(aiSessionId);
        return;
      }

      setStatusState("GENERATING_NEXT_QUESTION");
      const next = toQuestion(response.question);

      setSessionState((existing) => ({
        ...existing,
        answers: [...existing.answers, storedAnswer],
        currentQuestion: next,
        currentTopic: next.topic,
        currentQuestionNumber: existing.questionsAsked.length + 1,
        questionsAsked: [...existing.questionsAsked, next],
        coveredDays: [...new Set([...existing.coveredDays, next.day])],
        followUpCount: existing.followUpCount + (next.type !== "primary" ? 1 : 0),
        conversationHistory: [
          ...existing.conversationHistory,
          { role: "candidate", content, questionId: currentQuestion.id, order: existing.conversationHistory.length + 1 },
          { role: "interviewer", content: next.question, questionId: next.id, parentQuestionId: next.parentQuestionId, questionType: next.type, day: next.day, topic: next.topic, order: existing.conversationHistory.length + 2 }
        ]
      }));
      setStatusState("QUESTION_READY");
    } catch (requestError) {
      setError(requestError.message || "Unable to submit answer. Check connection and retry.");
      setStatusState("ERROR");
    } finally {
      submissionInFlight.current = false;
      setIsLoading(false);
    }
  };

  const retryStart = () => {
    initSession();
  };

  const coverage = getCoverage(sessionState);
  const topics = useMemo(() => buildTopicTimeline(allQuestionsAsked, currentTotalQuestionCount), [allQuestionsAsked, currentTotalQuestionCount]);

  return {
    candidate,
    messages,
    questionNumber: currentTotalQuestionCount,
    totalQuestions: 8,
    topics,
    isLoading,
    statusState,
    results,
    feedbackStatus,
    answered: sessionState.answers,
    followUpShown: false,
    followUpCount: sessionState.followUpCount,
    sessionState: { ...sessionState, error },
    coveredDays: sessionState.coveredDays || coverage.curriculumDaysCovered || [1],
    coverage,
    aiMode,
    submitAnswer,
    retryStart,
    fetchFeedback
  };
}

