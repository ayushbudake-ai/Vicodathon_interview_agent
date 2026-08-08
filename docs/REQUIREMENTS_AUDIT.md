# AI Interview Agent Requirements Audit

Audit date: 2026-08-08

## Test coverage

`backend/test/interviewApi.test.js` runs the complete HTTP lifecycle with a mocked AI provider for `CAND-001` (Senior Data Engineer), `CAND-002` (Backend Software Engineer), and `CAND-004` (Business Analyst). Each session starts through the API, receives an answer-driven follow-up, completes eight primary questions, spans at least four curriculum days, and receives structured feedback. Assertions for `CAND-004` verify that skipped day 28 is never selected.

Run: `cd backend && npm test`

| # | Requirement | Status | Evidence | Relevant file(s) | Test performed |
| --- | --- | --- | --- | --- | --- |
| 1 | Conversational technical interview | PASS | Ordered interviewer questions and candidate answers are persisted and rendered. | `backend/src/services/interviewService.js`; `frontend/src/hooks/useInterviewSession.js` | Three-profile API lifecycle; session ordering test. |
| 2 | Minimum 8 questions | PASS | Completion and feedback require eight primary questions. | `backend/src/routes/interview.js` | Three-profile API test reaches completion after eight primary questions. |
| 3 | At least 4 curriculum days | PASS | Completion and feedback require four unique covered days; generation prioritizes uncovered days. | `backend/src/routes/interview.js`; `backend/src/services/aiInterviewerService.js` | Three-profile API lifecycle. |
| 4 | Follow-ups from previous answers | PASS | AI receives `lastAnswer` and recent history; persisted follow-ups include their parent question ID. | `backend/src/services/aiInterviewerService.js`; `backend/src/services/interviewService.js` | API test asserts answer-derived follow-up content and parent linkage. |
| 5 | Conversation context maintained | PASS | Full ordered history is retained; recent history goes to the interviewer and all answers/evaluations go to final feedback. | `backend/src/services/interviewService.js`; `backend/src/services/aiInterviewerService.js` | API test verifies prior answer in AI context; session ordering test. |
| 6 | Structured feedback at end | PASS | Feedback is generated after coverage validation and validates all required score/list fields. | `backend/src/routes/interview.js`; `backend/src/services/aiInterviewerService.js` | Three-profile API feedback test. |
| 7 | Candidate-specific personalization | PASS | Candidate profile, attempts, learning signals, strengths, and weak areas are supplied to the model. | `backend/src/candidate/candidateContextService.js` | Three distinct candidate profiles exercised. |
| 8 | Completed-curriculum questions | PASS | Eligible topics derive from completed missions; AI outputs must match an eligible day/topic pair. | `backend/src/analysis/eligibleTopicService.js`; `backend/src/services/aiInterviewerService.js` | Curriculum and three-profile API tests. |
| 9 | Skipped topics excluded | PASS | Skipped/failed missions are never eligible. | `backend/src/analysis/eligibleTopicService.js` | Existing skipped-topic test and `CAND-004` API day-28 assertions. |
| 10 | Real answer evaluation | PASS | Continuing answers require a model-produced score; final feedback evaluates every stored answer. | `backend/src/services/aiInterviewerService.js`; `backend/src/routes/interview.js` | API test supplies evaluation-bearing responses. |
| 11 | Required HTTP API | PASS | `POST /api/interview/start`, `/answer`, and `/feedback` implement the interview lifecycle; health and candidate analysis endpoints are also exposed. | `backend/src/routes/interview.js`; `backend/src/server.js`; `frontend/src/services/api.js` | Three-profile lifecycle test covers all required POST endpoints. |
| 12 | No hardcoded final scores | PASS | Final feedback only comes from the AI response; the unused fixed-score evaluator was removed. | `backend/src/services/aiInterviewerService.js` | Source audit and feedback API test. |
| 13 | No static scripted follow-ups | PASS | The scripted frontend question bank and follow-up generator were removed; the model generates follow-ups from runtime context. | `backend/src/services/aiInterviewerService.js`; `frontend/src/services/interview/questionPlanner.js` | API test asserts answer-driven follow-up behavior. |

## Remediation completed

- Removed the unused fixed-score evaluator.
- Removed the static frontend question bank and scripted follow-up generator.
- Persisted follow-up parent question IDs.
- Added validation for AI answer evaluations, structured feedback, and eligible day/topic pairs.
- Expanded integration coverage to three profiles, answer-driven follow-ups, skipped-topic exclusion, minimum questions, and curriculum coverage.
