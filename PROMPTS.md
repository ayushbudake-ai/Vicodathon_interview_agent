# Prompt Records

This document contains only prompts that can be verified from repository source or retained development logs. It does not reconstruct or paraphrase missing human prompts.

## Source and Timestamp Policy

- Runtime prompt timestamps use the introducing commit timestamp when available. The repository does not retain individual model-call timestamps.
- `AI_USAGE_LOG.md` and `ai_log_file.md` record planning activities, but neither preserves the literal ChatGPT or Emergent input text. Those activities are noted as unavailable rather than being turned into invented prompts.

## Architecture

No verbatim architecture prompt was retained. `AI_USAGE_LOG.md` records that ChatGPT was used for project planning and architecture division, but records purpose and output only, not the prompt text.

## Frontend

No verbatim frontend-generation prompt was retained. `AI_USAGE_LOG.md` records Emergent as the tool used to create the initial frontend prototype, but it does not contain the input prompt.

## Backend

No separate backend-development prompt was retained. The exact runtime prompts below are the only backend AI prompt artifacts committed to the repository.

## Candidate Analysis

No AI prompt was used for candidate analysis. Candidate eligibility is derived deterministically from local candidate and curriculum data.

- **Date/time:** Not applicable
- **Tool:** Application code, no model call
- **Purpose:** Identify completed, eligible curriculum topics and exclude skipped or failed missions.
- **Prompt:** None.
- **What output was used:** `eligibleTopics` passed into the interview and feedback model contexts.
- **Files changed/used:** `backend/src/analysis/eligibleTopicService.js`, `backend/src/candidate/candidateContextService.js`

## AI Interviewer

### Runtime interviewer prompt

- **Date/time:** Original prompt: 2026-08-08 13:55:52 +0530 (`1f5c951`); current wording updated: 2026-08-08 15:23:55 +0530 (`e77cdb4`). Individual calls are not timestamped.
- **Tool:** OpenAI-compatible Chat Completions API, called by `structuredCompletion`
- **Purpose:** Generate the next curriculum-valid technical interview question using candidate context, prior conversation, answer context, and coverage policy.
- **Prompt:**

```text
You are a concise, professional AI technical interviewer. Return JSON only: {action,reason,question:{id,day,topic,type,difficulty,question},assessment:{score,technicalUnderstanding,reasoning,confidence,strengths,weaknesses,missingConcepts}}. Ask one technical question. Use only eligible days. Use lastAnswer and its assessment: strong answers can warrant one deeper follow-up; weak answers can warrant clarification; partial answers target missing concepts. Do not repeat a topic except for a meaningful follow-up. Follow coveragePolicy exactly; when requiresNewDay is true, return action new_topic and a primary question on uncoveredEligibleDays; when mustAskPrimary is true, return a primary question. Never reveal scoring or give answers.
```

- **What output was used:** Parsed `question`, `assessment`, and `action`; the question is persisted and returned to the frontend.
- **Files changed/used:** `backend/src/services/aiInterviewerService.js`, `backend/src/routes/interview.js`, `backend/src/services/interviewService.js`

## Follow-Up Generation

No separate follow-up prompt exists. Follow-ups use the **Runtime interviewer prompt** above with `lastAnswer`, `recentConversation`, and `coveragePolicy` in its input context.

- **Date/time:** Original prompt: 2026-08-08 13:55:52 +0530 (`1f5c951`); current wording updated: 2026-08-08 15:23:55 +0530 (`e77cdb4`).
- **Tool:** OpenAI-compatible Chat Completions API
- **Purpose:** Generate a runtime follow-up or clarification that is linked to the preceding answer.
- **Prompt:** The exact Runtime interviewer prompt above; no additional prompt was used.
- **What output was used:** A `question` with type `follow-up` or `clarification`, stored with `parentQuestionId`.
- **Files changed/used:** `backend/src/services/aiInterviewerService.js`, `backend/src/services/interviewService.js`, `backend/test/interviewApi.test.js`

## Answer Evaluation

No separate evaluator prompt exists. The **Runtime interviewer prompt** requests the assessment object together with the next question.

- **Date/time:** Original prompt: 2026-08-08 13:55:52 +0530 (`1f5c951`); current wording updated: 2026-08-08 15:23:55 +0530 (`e77cdb4`).
- **Tool:** OpenAI-compatible Chat Completions API
- **Purpose:** Evaluate a continuing answer before choosing the next question.
- **Prompt:** The exact Runtime interviewer prompt above; no additional prompt was used.
- **What output was used:** `assessment.score` and related assessment fields are validated and stored in the session.
- **Files changed/used:** `backend/src/services/aiInterviewerService.js`, `backend/src/routes/interview.js`, `backend/src/services/interviewService.js`

## Feedback

### Runtime final-feedback prompt

- **Date/time:** 2026-08-08 13:55:52 +0530 (introducing commit `1f5c951`; individual calls are not timestamped)
- **Tool:** OpenAI-compatible Chat Completions API, called by `structuredCompletion`
- **Purpose:** Generate grounded, structured feedback after interview completion.
- **Prompt:**

```text
You are an AI interview evaluator. Return JSON only with: overallScore, technicalKnowledge, problemSolving, reasoning, communication, strengths, weaknesses, topicsToRevise, recommendations, curriculumCoverage, questionPerformance. Claims must be grounded in answers. Scores 0-100. Do not reveal private chain-of-thought.
```

- **What output was used:** Validated score fields, strengths, weaknesses, revision topics, recommendations, and question performance returned by `POST /api/interview/feedback` and rendered in the report.
- **Files changed/used:** `backend/src/services/aiInterviewerService.js`, `backend/src/routes/interview.js`, `frontend/src/hooks/useInterviewSession.js`, `frontend/src/pages/Results.jsx`

## Testing

No AI testing prompt was retained. The repository contains deterministic Node test code and an AI-provider mock, not a natural-language model prompt.

- **Date/time:** Not applicable
- **Tool:** Node.js test runner and mocked `fetch`
- **Purpose:** Exercise three candidate profiles, curriculum eligibility, answer-driven follow-up transport, question coverage, and final feedback API flow.
- **Prompt:** None.
- **What output was used:** Test assertions and pass/fail results.
- **Files changed/used:** `backend/test/interviewApi.test.js`, `backend/test/candidateCurriculum.test.js`, `backend/test/interviewSession.test.js`
