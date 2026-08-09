import { api } from "./api";

export async function fetchInterviewSession(sessionId) {
  return api.getSession(sessionId);
}

export async function startInterviewSession(candidateId, domain, difficulty) {
  return api.startInterview(candidateId, domain, difficulty);
}

export async function submitAnswerToSession(sessionId, questionId, answer) {
  return api.submitAnswer(sessionId, questionId, answer);
}

export async function completeInterviewSession(sessionId) {
  return api.finishInterview(sessionId);
}

export async function chatWithEvaluation(sessionId, candidateId, message, history = []) {
  return api.chatEvaluation(sessionId, candidateId, message, history);
}

