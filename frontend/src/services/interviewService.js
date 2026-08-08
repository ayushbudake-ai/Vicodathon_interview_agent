import { api } from "./api";

export async function startInterviewSession(candidateId) {
  return api.startInterview(candidateId);
}

export async function submitAnswerToSession(sessionId, questionId, answer) {
  return api.submitAnswer(sessionId, questionId, answer);
}

export async function completeInterviewSession(sessionId) {
  return api.finishInterview(sessionId);
}
