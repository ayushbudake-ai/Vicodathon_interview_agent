import test from "node:test";
import assert from "node:assert/strict";
import { CandidateAnalyzer, analyzeCandidate } from "../src/candidate/candidateAnalyzer.js";
import { CurriculumService, curriculumService } from "../src/curriculum/curriculumService.js";
import { analyzeCandidateCurriculum, getEligibleTopics } from "../src/analysis/eligibleTopicService.js";

test("a valid candidate returns normalized candidate information", () => {
  const candidate = analyzeCandidate("CAND-001");
  assert.equal(candidate.candidateId, "CAND-001");
  assert.equal(candidate.name, "Sarah Johnson");
});

test("completed curriculum days are identified from passed missions", () => {
  assert.deepEqual(analyzeCandidate("CAND-001").completedDays, [7, 8, 10, 12, 16, 22, 23, 28, 31]);
});

test("skipped topics are never eligible", () => {
  const eligible = getEligibleTopics("CAND-004");
  assert.equal(eligible.some((topic) => topic.day === 28), false);
});

test("curriculum day lookup returns the documented day", () => {
  assert.equal(curriculumService.getDay(10).title, "Retrieval & Matching Engine");
  assert.equal(curriculumService.getDay(999), null);
});

test("attempts are preserved for eligible topics", () => {
  assert.equal(getEligibleTopics("CAND-001").find((topic) => topic.day === 10).attempts, 2);
});

test("learning signals are preserved", () => {
  assert.deepEqual(analyzeCandidateCurriculum("CAND-001").candidate.learningSignals, { commitDays: 28, missionsCompleted: 30, missionsFirstTry: 20 });
});

test("an invalid candidate ID is handled safely", () => {
  assert.equal(analyzeCandidateCurriculum("NOT-A-CANDIDATE"), null);
});

test("a candidate with no eligible topics returns an empty list", () => {
  const analyzer = new CandidateAnalyzer([{ member: { id: "EMPTY", name: "Empty Candidate" }, missions: [] }]);
  const curriculum = new CurriculumService([]);
  assert.deepEqual(getEligibleTopics("EMPTY", { analyzer, curriculum }), []);
});
