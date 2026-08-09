import { api } from "./api";

export async function fetchInterviewSession(sessionId) {
  return api.getSession(sessionId);
}

export async function startInterviewSession(params) {
  return api.startInterview(params);
}

export async function submitAnswerToSession(sessionId, questionId, answer) {
  return api.submitAnswer(sessionId, questionId, answer);
}

export async function completeInterviewSession(sessionId) {
  return api.finishInterview(sessionId);
}
