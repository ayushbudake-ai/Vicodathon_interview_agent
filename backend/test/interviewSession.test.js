import test from "node:test";
import assert from "node:assert/strict";
import { InterviewSessionService } from "../src/services/interviewService.js";

function createServiceWithSession() {
  const service = new InterviewSessionService();
  const session = service.createSession("CAND-001");
  service.activateSession(session.sessionId);
  return { service, session };
}

test("creates a session with the expected default state", () => {
  const service = new InterviewSessionService();
  const session = service.createSession("CAND-001");
  assert.equal(session.candidateId, "CAND-001");
  assert.equal(session.status, "created");
  assert.deepEqual(session.questions, []);
  assert.equal(session.questionCount, 0);
});

test("retrieves an existing session", () => {
  const { service, session } = createServiceWithSession();
  assert.equal(service.getSession(session.sessionId), session);
});

test("adds question metadata and updates the current question", () => {
  const { service, session } = createServiceWithSession();
  const question = service.addQuestion(session.sessionId, { id: "q1", text: "Explain embeddings.", curriculumDay: 7, topic: "Embeddings", type: "technical", difficulty: "medium" });
  assert.equal(question.id, "q1");
  assert.equal(service.getSession(session.sessionId).currentQuestion.text, "Explain embeddings.");
});

test("stores the original answer text", () => {
  const { service, session } = createServiceWithSession();
  const answer = service.addAnswer(session.sessionId, { questionId: "q1", text: "Embeddings map meaning to vectors." });
  assert.equal(answer.text, "Embeddings map meaning to vectors.");
});

test("multiple questions and answers preserve insertion order", () => {
  const { service, session } = createServiceWithSession();
  service.addQuestion(session.sessionId, { id: "q1", text: "First question" });
  service.addAnswer(session.sessionId, { questionId: "q1", text: "First answer" });
  service.addQuestion(session.sessionId, { id: "q2", text: "Second question" });
  service.addAnswer(session.sessionId, { questionId: "q2", text: "Second answer" });
  const stored = service.getSession(session.sessionId);
  assert.deepEqual(stored.questions.map((question) => question.id), ["q1", "q2"]);
  assert.deepEqual(stored.answers.map((answer) => answer.text), ["First answer", "Second answer"]);
});

test("conversation context contains the questions and original answers", () => {
  const { service, session } = createServiceWithSession();
  service.addQuestion(session.sessionId, { id: "q1", text: "Explain retrieval.", curriculumDay: 10, topic: "Retrieval" });
  service.addAnswer(session.sessionId, { questionId: "q1", text: "I would combine lexical and semantic search." });
  const context = service.getConversationContext(session.sessionId);
  assert.equal(context.previousQuestions[0].text, "Explain retrieval.");
  assert.equal(context.previousAnswers[0].text, "I would combine lexical and semantic search.");
});

test("tracks curriculum days without duplicates", () => {
  const { service, session } = createServiceWithSession();
  service.addQuestion(session.sessionId, { text: "One", curriculumDay: 10, topic: "Retrieval" });
  service.addQuestion(session.sessionId, { text: "Two", curriculumDay: 10, topic: "Retrieval" });
  assert.deepEqual(service.getSession(session.sessionId).curriculumDaysCovered, [10]);
});

test("marks and counts follow-up questions", () => {
  const { service, session } = createServiceWithSession();
  const question = service.addQuestion(session.sessionId, { text: "Why?", isFollowUp: true });
  assert.equal(question.isFollowUp, true);
  assert.equal(service.getSession(session.sessionId).followUpCount, 1);
});

test("completed sessions reject new questions and answers", () => {
  const { service, session } = createServiceWithSession();
  service.completeSession(session.sessionId);
  assert.equal(service.addQuestion(session.sessionId, { text: "No more questions" }), null);
  assert.equal(service.addAnswer(session.sessionId, { text: "No more answers" }), null);
});

test("invalid session IDs are handled safely", () => {
  const service = new InterviewSessionService();
  assert.equal(service.getSession("missing"), null);
  assert.equal(service.getConversationContext("missing"), null);
  assert.equal(service.addAnswer("missing", { text: "answer" }), null);
});
