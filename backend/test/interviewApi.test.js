import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server.js";

function request(server, path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({ port: server.address().port, path, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on("error", reject);
    req.end(payload);
  });
}

function getRequest(server, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port: server.address().port, path, method: "GET" }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("complete API interview flow works for three candidate profiles with answer-driven follow-ups", async () => {
  const originalFetch = global.fetch;
  const previousKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = "test-key";
  global.fetch = async (_url, options) => {
    const context = JSON.parse(JSON.parse(options.body).messages[1].content);
    const isFeedback = Array.isArray(context.answers);
    const questionNumber = context.questionsAsked?.length || 0;
    const eligible = context.eligibleTopics;
    if (!isFeedback && questionNumber === 4) {
      assert.equal(context.lastAnswer.answer, "Candidate response 4");
      assert.equal(context.recentConversation.at(-1).content, "Candidate response 4");
    }
    const isFollowUp = !isFeedback && questionNumber === 4;
    const content = isFeedback
      ? { overallScore: 78, technicalKnowledge: 80, problemSolving: 77, reasoning: 76, communication: 81, strengths: ["Clear trade-off analysis"], weaknesses: ["Add more observability detail"], topicsToRevise: ["Observability"], recommendations: ["Practice evaluation metrics."], questionPerformance: [{ topic: eligible[0].topic, score: 78 }] }
      : { action: isFollowUp ? "follow_up" : "new_topic", question: { id: `q-${questionNumber + 1}`, day: (isFollowUp ? context.questionsAsked.at(-1) : eligible[questionNumber % eligible.length]).day, topic: (isFollowUp ? context.questionsAsked.at(-1) : eligible[questionNumber % eligible.length]).topic, type: isFollowUp ? "follow-up" : "primary", difficulty: "intermediate", question: isFollowUp ? `Follow-up on: ${context.lastAnswer.answer}` : `Question ${questionNumber + 1}` }, assessment: { score: 78 } };
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), { status: 200 });
  };
  const server = app.listen(0);
  try {
    for (const candidateId of ["CAND-001", "CAND-002", "CAND-004"]) {
      const start = await request(server, "/api/interview/start", { candidateId });
      assert.equal(start.status, 201);
      let question = start.body.question;
      if (candidateId === "CAND-004") assert.notEqual(question.curriculumDay, 28);
      let completed = false;
      let answerCount = 0;
      while (!completed) {
        answerCount += 1;
        const answeredQuestionId = question.id;
        const answer = await request(server, "/api/interview/answer", { sessionId: start.body.sessionId, questionId: answeredQuestionId, answer: `Candidate response ${answerCount}` });
        assert.equal(answer.status, 200, JSON.stringify(answer.body));
        completed = answer.body.completed === true;
        if (!completed) {
          question = answer.body.question;
          if (candidateId === "CAND-004") assert.notEqual(question.curriculumDay, 28);
          if (answerCount === 4) {
            assert.equal(question.type, "follow-up");
            assert.equal(question.parentQuestionId, answeredQuestionId);
          }
        }
      }
      assert.equal(answerCount, 9);
      const feedback = await request(server, "/api/interview/feedback", { sessionId: start.body.sessionId });
      assert.equal(feedback.status, 200);
      assert.equal(feedback.body.feedback.overallScore, 78);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    global.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.AI_API_KEY;
    else process.env.AI_API_KEY = previousKey;
  }
});

test("supports GET /api/interview/:sessionId for session recovery", async () => {
  const server = app.listen(0);
  try {
    const start = await request(server, "/api/interview/start", { candidateId: "CAND-001" });
    assert.equal(start.status, 201);
    const sessionRes = await getRequest(server, `/api/interview/${start.body.sessionId}`);
    assert.equal(sessionRes.status, 200);
    assert.equal(sessionRes.body.sessionId, start.body.sessionId);
    assert.equal(sessionRes.body.currentQuestion.id, start.body.question.id);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

