import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server.js";
import { addAnswerToSession, addEvaluationToSession, addQuestionToSession, createInterviewSession, finalizeSession, interviewSessionService } from "../src/services/interviewService.js";

function request(server, path, body = {}, method = "POST") {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      port: server.address().port,
      path,
      method,
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.end(payload);
  });
}

test("completed interviews generate a structured evaluation report with evidence", async () => {
  const server = app.listen(0);
  try {
    const session = createInterviewSession("CAND-001", "Backend Development", "Advanced");
    interviewSessionService.activateSession(session.sessionId);
    addQuestionToSession(session.sessionId, { id: "q1", text: "Explain how you would design a caching layer for a high-traffic API.", topic: "Caching", curriculumDay: 7, type: "primary", difficulty: "advanced" });
    addAnswerToSession(session.sessionId, { questionId: "q1", answer: "I would use Redis with a cache-aside pattern and include TTL and invalidation policies." });
    addEvaluationToSession(session.sessionId, {
      questionId: "q1",
      score: 82,
      technicalKnowledge: 84,
      problemSolving: 80,
      systemDesign: 78,
      productionThinking: 75,
      communication: 81,
      practicalExperience: 79,
      strengths: ["Mentioned cache-aside and TTL."],
      weaknesses: ["Did not cover stale-data handling."],
      missingConcepts: ["Cache invalidation consistency"]
    });
    finalizeSession(session.sessionId);

    const result = await request(server, `/api/interview/${session.sessionId}/evaluation`, { candidateId: "CAND-001" });
    assert.equal(result.status, 200);
    assert.equal(result.body.evaluation.overallScore > 0, true);
    assert.ok(result.body.evaluation.competencies.some((competency) => competency.name === "System Design"));
    assert.ok(result.body.evaluation.questionAnalysis[0].evidence.includes("cache") || result.body.evaluation.questionAnalysis[0].evidence.includes("Redis"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("insufficient evidence is surfaced as not enough evidence instead of fabricated scores", async () => {
  const server = app.listen(0);
  try {
    const session = createInterviewSession("CAND-002", "Backend Development", "Advanced");
    interviewSessionService.activateSession(session.sessionId);
    addQuestionToSession(session.sessionId, { id: "q2", text: "Tell me about your approach to observability.", topic: "Observability", curriculumDay: 10, type: "primary", difficulty: "advanced" });
    addAnswerToSession(session.sessionId, { questionId: "q2", answer: "I would instrument the service and add dashboards." });
    finalizeSession(session.sessionId);

    const result = await request(server, `/api/interview/${session.sessionId}/evaluation`, { candidateId: "CAND-002" });
    assert.equal(result.status, 200);
    const competency = result.body.evaluation.competencies.find((item) => item.name === "Production Thinking");
    assert.ok(competency);
    assert.equal(competency.score, null);
    assert.ok(competency.evidence.some((item) => item.includes("Not enough evidence")));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("chatbot explains actual interview evidence and tracks sources", async () => {
  const server = app.listen(0);
  try {
    const session = createInterviewSession("CAND-003", "Backend Development", "Advanced");
    interviewSessionService.activateSession(session.sessionId);
    addQuestionToSession(session.sessionId, { id: "q3", text: "Explain a system design trade-off.", topic: "System Design", curriculumDay: 14, type: "primary", difficulty: "advanced" });
    addAnswerToSession(session.sessionId, { questionId: "q3", answer: "I would choose an event-driven architecture for decoupling, but I would also add retries and idempotency." });
    addEvaluationToSession(session.sessionId, {
      questionId: "q3",
      score: 76,
      technicalKnowledge: 76,
      problemSolving: 74,
      systemDesign: 80,
      productionThinking: 72,
      communication: 78,
      practicalExperience: 74,
      strengths: ["Mentioned retries and idempotency."],
      weaknesses: ["Did not discuss failure isolation."],
      missingConcepts: ["Circuit breakers"]
    });
    finalizeSession(session.sessionId);

    const result = await request(server, `/api/interview/${session.sessionId}/evaluation/chat`, { candidateId: "CAND-003", message: "Why was my system design score low?" });
    assert.equal(result.status, 200);
    assert.ok(result.body.answer.length > 0);
    assert.ok(result.body.sources.some((source) => source.questionId === "q3"));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("chatbot rejects access to another candidate's session", async () => {
  const server = app.listen(0);
  try {
    const session = createInterviewSession("CAND-004", "Backend Development", "Advanced");
    interviewSessionService.activateSession(session.sessionId);
    addQuestionToSession(session.sessionId, { id: "q4", text: "What is your approach to distributed systems?", topic: "Distributed Systems", curriculumDay: 20, type: "primary", difficulty: "advanced" });
    addAnswerToSession(session.sessionId, { questionId: "q4", answer: "I would use retries and timeouts." });
    addEvaluationToSession(session.sessionId, { questionId: "q4", score: 70, technicalKnowledge: 70, problemSolving: 70, systemDesign: 70, productionThinking: 70, communication: 70, practicalExperience: 70 });
    finalizeSession(session.sessionId);

    const result = await request(server, `/api/interview/${session.sessionId}/evaluation/chat`, { candidateId: "CAND-999", message: "What should I improve?" });
    assert.equal(result.status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("incomplete interviews are rejected for evaluation", async () => {
  const server = app.listen(0);
  try {
    const session = createInterviewSession("CAND-005", "Backend Development", "Advanced");
    interviewSessionService.activateSession(session.sessionId);
    addQuestionToSession(session.sessionId, { id: "q5", text: "Describe your biggest system trade-off.", topic: "Trade-offs", curriculumDay: 5, type: "primary", difficulty: "advanced" });
    addAnswerToSession(session.sessionId, { questionId: "q5", answer: "I am still thinking through the trade-offs." });

    const result = await request(server, `/api/interview/${session.sessionId}/evaluation`, { candidateId: "CAND-005" });
    assert.equal(result.status, 400);
    assert.equal(result.body.error, "Interview is not completed");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
