import { randomUUID } from "crypto";

/** In-memory interview state. It is intentionally ephemeral until persistence is introduced. */
export class InterviewSessionService {
  constructor() {
    this.sessions = new Map();
  }

  createSession(candidateId) {
    const session = {
      sessionId: randomUUID(),
      candidateId,
      startedAt: new Date().toISOString(),
      status: "created",
      questions: [],
      answers: [],
      evaluations: [],
      topicsCovered: [],
      curriculumDaysCovered: [],
      currentQuestion: null,
      currentTopic: null,
      questionCount: 0,
      followUpCount: 0
      ,conversationHistory: []
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  activateSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session || session.status !== "created") return null;
    session.status = "active";
    return session;
  }

  addQuestion(sessionId, question = {}) {
    const session = this.getSession(sessionId);
    if (!session || session.status === "completed" || !question.text?.trim()) return null;

    const storedQuestion = {
      id: question.id ?? randomUUID(),
      text: question.text.trim(),
      curriculumDay: Number.isFinite(question.curriculumDay) ? question.curriculumDay : null,
      topic: question.topic ?? null,
      type: question.type ?? null,
      difficulty: question.difficulty ?? null,
      parentQuestionId: question.parentQuestionId ?? null,
      isFollowUp: question.isFollowUp === true,
      createdAt: new Date().toISOString()
    };
    session.questions.push(storedQuestion);
    session.conversationHistory.push({ role: "interviewer", content: storedQuestion.text, questionId: storedQuestion.id, questionType: storedQuestion.type, day: storedQuestion.curriculumDay, topic: storedQuestion.topic, order: session.conversationHistory.length + 1 });
    session.currentQuestion = storedQuestion;
    session.currentTopic = storedQuestion.topic;
    session.questionCount = session.questions.length;

    if (storedQuestion.topic && !session.topicsCovered.includes(storedQuestion.topic)) {
      session.topicsCovered.push(storedQuestion.topic);
    }
    if (storedQuestion.curriculumDay !== null && !session.curriculumDaysCovered.includes(storedQuestion.curriculumDay)) {
      session.curriculumDaysCovered.push(storedQuestion.curriculumDay);
    }
    if (storedQuestion.isFollowUp) session.followUpCount += 1;

    return storedQuestion;
  }

  addAnswer(sessionId, answer = {}) {
    const session = this.getSession(sessionId);
    const text = answer.text ?? answer.answer;
    if (!session || session.status === "completed" || !text?.trim()) return null;

    const storedAnswer = {
      questionId: answer.questionId ?? null,
      text: text.trim(),
      answeredAt: new Date().toISOString()
    };
    session.answers.push(storedAnswer);
    session.conversationHistory.push({ role: "candidate", content: storedAnswer.text, questionId: storedAnswer.questionId, order: session.conversationHistory.length + 1 });
    return storedAnswer;
  }

  addEvaluation(sessionId, evaluation) {
    const session = this.getSession(sessionId);
    if (!session || session.status === "completed" || evaluation == null) return null;
    session.evaluations.push(evaluation);
    return evaluation;
  }

  updateCurrentTopic(sessionId, topic) {
    const session = this.getSession(sessionId);
    if (!session || session.status === "completed") return null;
    session.currentTopic = topic ?? null;
    return session;
  }

  completeSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session || session.status === "completed") return null;
    session.status = "completed";
    return session;
  }

  getConversationContext(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      candidateId: session.candidateId,
      status: session.status,
      previousQuestions: session.questions,
      previousAnswers: session.answers,
      conversationHistory: session.conversationHistory,
      topicsDiscussed: session.topicsCovered,
      curriculumDaysCovered: session.curriculumDaysCovered,
      evaluations: session.evaluations,
      currentQuestion: session.currentQuestion,
      currentTopic: session.currentTopic,
      followUpCount: session.followUpCount
    };
  }
}

export const interviewSessionService = new InterviewSessionService();

// Compatibility exports for the existing interview route.
export const createInterviewSession = (candidateId) => interviewSessionService.createSession(candidateId);
export const getInterviewSession = (sessionId) => interviewSessionService.getSession(sessionId);
export const addQuestionToSession = (sessionId, question) => interviewSessionService.addQuestion(sessionId, question);
export const addAnswerToSession = (sessionId, answer) => interviewSessionService.addAnswer(sessionId, answer);
export const addEvaluationToSession = (sessionId, evaluation) => interviewSessionService.addEvaluation(sessionId, evaluation);
export const updateSessionCurrentTopic = (sessionId, topic) => interviewSessionService.updateCurrentTopic(sessionId, topic);
export const getConversationContext = (sessionId) => interviewSessionService.getConversationContext(sessionId);
export const finalizeSession = (sessionId) => interviewSessionService.completeSession(sessionId);
