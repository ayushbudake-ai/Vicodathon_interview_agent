import { getCoverage } from "../services/interview/questionPlanner";

export const normalizeAnswer = (answer) => (answer || "").trim();

export function buildTopicTimeline(questionList, questionNumber) {
  return questionList.map((question, index) => ({ id: question.id, name: question.topic, status: index < questionNumber - 1 ? "complete" : index === questionNumber - 1 ? "current" : "upcoming", day: question.day }));
}

export function createInitialInterviewState(candidate, firstQuestion = null) {
  const firstMessage = firstQuestion ? [{ role: "interviewer", content: firstQuestion.question, questionId: firstQuestion.id, questionType: "primary", day: firstQuestion.day, topic: firstQuestion.topic, order: 1 }] : [];
  return {
    sessionId: `practice-${Date.now()}`, candidateId: candidate?.id || null, startedAt: new Date().toISOString(), currentQuestionNumber: firstQuestion ? 1 : 0,
    questionsAsked: firstQuestion ? [firstQuestion] : [], answers: [], currentQuestion: firstQuestion || null, currentTopic: firstQuestion?.topic || null,
    coveredDays: firstQuestion ? [firstQuestion.day] : [], conversationHistory: firstMessage, interviewStatus: firstQuestion ? "active" : "error",
    followUpCount: 0, completionState: false, evaluations: [], finalFeedback: null
  };
}

export function getSessionCoverage(sessionState) { return getCoverage(sessionState); }

export function createSessionSnapshot(sessionState) {
  return { ...sessionState, coverage: getSessionCoverage(sessionState) };
}
