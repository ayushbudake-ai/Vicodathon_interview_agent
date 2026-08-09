import { randomUUID } from "crypto";

/** In-memory interview state. It is intentionally ephemeral until persistence is introduced. */
export class InterviewSessionService {
  constructor() {
    this.sessions = new Map();
  }

  createSession(candidateId, domain = "Backend Development", difficulty = "Advanced") {
    const session = {
      sessionId: randomUUID(),
      candidateId,
      domain: domain || "Backend Development",
      difficulty: difficulty || "Advanced",
      startedAt: new Date().toISOString(),
      status: "created",
      phase: "warmup", // warmup -> project -> technical -> system_design -> production -> complete
      questions: [],
      answers: [],
      evaluations: [],
      topicsCovered: [],
      curriculumDaysCovered: [],
      currentQuestion: null,
      currentTopic: null,
      questionCount: 0,
      followUpCount: 0,
      conversationHistory: [],
      candidateSignals: {
        projects: [],
        technologies: [],
        claimedExperience: [],
        strengths: [],
        weaknesses: []
      },
      skills: {
        technicalKnowledge: { score: null, confidence: "low" },
        problemSolving: { score: null, confidence: "low" },
        systemDesign: { score: null, confidence: "low" },
        productionThinking: { score: null, confidence: "low" },
        communication: { score: null, confidence: "low" },
        practicalExperience: { score: null, confidence: "low" }
      }
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
      curriculumDay: Number.isFinite(question.curriculumDay) ? question.curriculumDay : (question.day ?? null),
      topic: question.topic ?? "Technical Discussion",
      type: question.type ?? "primary",
      difficulty: question.difficulty ?? session.difficulty,
      parentQuestionId: question.parentQuestionId ?? null,
      isFollowUp: question.isFollowUp === true || question.type === "follow-up",
      createdAt: new Date().toISOString()
    };
    session.questions.push(storedQuestion);
    session.conversationHistory.push({
      role: "interviewer",
      content: storedQuestion.text,
      questionId: storedQuestion.id,
      parentQuestionId: storedQuestion.parentQuestionId,
      questionType: storedQuestion.type,
      day: storedQuestion.curriculumDay,
      topic: storedQuestion.topic,
      order: session.conversationHistory.length + 1
    });
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
    session.conversationHistory.push({
      role: "candidate",
      content: storedAnswer.text,
      questionId: storedAnswer.questionId,
      order: session.conversationHistory.length + 1
    });
    return storedAnswer;
  }

  addEvaluation(sessionId, evaluation) {
    const session = this.getSession(sessionId);
    if (!session || session.status === "completed" || evaluation == null) return null;
    session.evaluations.push(evaluation);

    // Update skills state if scores are provided
    const updateSkill = (key, val) => {
      if (Number.isFinite(val) && val >= 0 && val <= 100) {
        const current = session.skills[key].score;
        session.skills[key].score = current === null ? val : Math.round((current + val) / 2);
        session.skills[key].confidence = "medium";
      }
    };
    if (evaluation.technicalKnowledge !== undefined) updateSkill("technicalKnowledge", evaluation.technicalKnowledge);
    if (evaluation.problemSolving !== undefined) updateSkill("problemSolving", evaluation.problemSolving);
    if (evaluation.systemDesign !== undefined) updateSkill("systemDesign", evaluation.systemDesign);
    if (evaluation.productionThinking !== undefined) updateSkill("productionThinking", evaluation.productionThinking);
    if (evaluation.communication !== undefined) updateSkill("communication", evaluation.communication);
    if (evaluation.practicalExperience !== undefined) updateSkill("practicalExperience", evaluation.practicalExperience);

    return evaluation;
  }

  updateSessionState(sessionId, updates = {}) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    if (updates.phase) session.phase = updates.phase;
    if (updates.difficulty) session.difficulty = updates.difficulty;
    if (updates.candidateSignals) {
      if (updates.candidateSignals.projects) session.candidateSignals.projects = [...new Set([...session.candidateSignals.projects, ...updates.candidateSignals.projects])];
      if (updates.candidateSignals.technologies) session.candidateSignals.technologies = [...new Set([...session.candidateSignals.technologies, ...updates.candidateSignals.technologies])];
    }
    return session;
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
    session.completedAt = new Date().toISOString();
    return session;
  }

  getConversationContext(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    return {
      sessionId: session.sessionId,
      candidateId: session.candidateId,
      status: session.status,
      phase: session.phase,
      difficulty: session.difficulty,
      previousQuestions: session.questions,
      previousAnswers: session.answers,
      conversationHistory: session.conversationHistory,
      topicsDiscussed: session.topicsCovered,
      curriculumDaysCovered: session.curriculumDaysCovered,
      evaluations: session.evaluations,
      currentQuestion: session.currentQuestion,
      currentTopic: session.currentTopic,
      followUpCount: session.followUpCount,
      candidateSignals: session.candidateSignals,
      skills: session.skills
    };
  }
}

export const interviewSessionService = new InterviewSessionService();

// Compatibility exports for the existing interview route.
export const createInterviewSession = (candidateId, domain, difficulty) => interviewSessionService.createSession(candidateId, domain, difficulty);
export const getInterviewSession = (sessionId) => interviewSessionService.getSession(sessionId);
export const addQuestionToSession = (sessionId, question) => interviewSessionService.addQuestion(sessionId, question);
export const addAnswerToSession = (sessionId, answer) => interviewSessionService.addAnswer(sessionId, answer);
export const addEvaluationToSession = (sessionId, evaluation) => interviewSessionService.addEvaluation(sessionId, evaluation);
export const updateSessionCurrentTopic = (sessionId, topic) => interviewSessionService.updateCurrentTopic(sessionId, topic);
export const getConversationContext = (sessionId) => interviewSessionService.getConversationContext(sessionId);
export const finalizeSession = (sessionId) => interviewSessionService.completeSession(sessionId);

