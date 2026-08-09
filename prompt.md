# AI Development Log — AI Interview Agent

> **Project:** AI Interview Agent — ABTalks / ViCodathon  
> **Team:** Ayush Budake, Abhay Patil, Shreeya Patil  
> **Repository:** `Vicodathon_interview_agent`

---

# 1. Source and Timestamp Policy

This document distinguishes between **verbatim AI prompts that are actually retained** and development activities for which only a summary or repository evidence is available.

- Runtime prompt timestamps use the introducing Git commit timestamp when available.
- Individual model-call timestamps are not retained by the repository.
- Where an exact prompt is unavailable, it is explicitly marked **“Not retained”**.
- Deterministic application logic is marked **“Prompt: None”**.
- Git commits are used as development evidence, not as proof of a specific AI prompt.
- Claude prompts supplied from retained development history are preserved separately.
- No missing prompt is reconstructed or invented.
- Repository history is treated as evidence of implementation, while the actual AI prompt is only recorded when independently available.

---

# 2. Architecture

## Architecture Planning

- **Tool:** ChatGPT / Codex
- **Date/time:** Not available
- **Purpose:** Project planning and architecture division.
- **Prompt:** No verbatim architecture prompt was retained.
- **What is verified:** Retained development records show that AI assistance was used for project planning and architecture division.
- **Output used:** Overall application architecture and implementation planning.

The original architecture prompt is unavailable and is therefore not reconstructed.

---

# 3. Frontend

## Initial Frontend Prototype

- **Tool:** Emergent
- **Date/time:** Not available
- **Purpose:** Create the initial frontend prototype.
- **Prompt:** No verbatim frontend-generation prompt was retained.
- **What is verified:** Retained development records identify Emergent as the tool used for the initial frontend prototype.
- **Output used:** Initial frontend application/prototype.

The original Emergent input text was not retained.

---

# 4. Backend

## Backend Development

- **Tool:** ChatGPT / Codex / development tooling
- **Date/time:** Not available for the original planning prompts.
- **Purpose:** Backend implementation, interview APIs, AI interviewer integration, session management and testing.
- **Prompt:** No separate general backend-development prompt was retained.
- **Important note:** The exact runtime AI prompts documented later in this file are the backend model-call prompt artifacts that were retained.

---

# 5. Candidate Analysis

## Candidate Eligibility

- **Date/time:** Not applicable
- **Tool:** Application code; no model call
- **Purpose:** Identify completed and eligible curriculum topics and exclude skipped or failed missions.
- **Prompt:** None.
- **Output used:** `eligibleTopics` passed into interview and feedback model contexts.
- **Files changed/used:**
  - `backend/src/analysis/eligibleTopicService.js`
  - `backend/src/candidate/candidateContextService.js`

Candidate eligibility is derived deterministically from local candidate and curriculum data.

---

# 6. AI Interviewer

## Runtime Interviewer Prompt

- **Date/time:** Original prompt introduced at `2026-08-08 13:55:52 +0530`
- **Introducing commit:** `1f5c951`
- **Current wording updated:** `2026-08-08 15:23:55 +0530`
- **Update commit:** `e77cdb4`
- **Individual model-call timestamps:** Not retained.
- **Tool:** OpenAI-compatible Chat Completions API, called by `structuredCompletion`.
- **Purpose:** Generate the next curriculum-valid technical interview question using candidate context, prior conversation, answer context and coverage policy.

### Verbatim Prompt

```text
You are a concise, professional AI technical interviewer. Return JSON only: {action,reason,question:{id,day,topic,type,difficulty,question},assessment:{score,technicalUnderstanding,reasoning,confidence,strengths,weaknesses,missingConcepts}}. Ask one technical question. Use only eligible days. Use lastAnswer and its assessment: strong answers can warrant one deeper follow-up; weak answers can warrant clarification; partial answers target missing concepts. Do not repeat a topic except for a meaningful follow-up. Follow coveragePolicy exactly; when requiresNewDay is true, return action new_topic and a primary question on uncoveredEligibleDays; when mustAskPrimary is true, return a primary question. Never reveal scoring or give answers.
```

### What Output Was Used

The application parses and validates:

- `action`
- `reason`
- `question`
- `assessment`

The generated question is persisted and returned to the frontend.

### Files Changed/Used

- `backend/src/services/aiInterviewerService.js`
- `backend/src/routes/interview.js`
- `backend/src/services/interviewService.js`

---

# 7. Follow-Up Generation

## Runtime Follow-Up

- **Date/time:** Original prompt introduced at `2026-08-08 13:55:52 +0530`
- **Introducing commit:** `1f5c951`
- **Current wording updated:** `2026-08-08 15:23:55 +0530`
- **Update commit:** `e77cdb4`
- **Tool:** OpenAI-compatible Chat Completions API.
- **Purpose:** Generate a runtime follow-up or clarification linked to the preceding candidate answer.
- **Prompt:** The exact **Runtime Interviewer Prompt** above. No separate follow-up prompt was retained.

The model receives contextual information including:

- `lastAnswer`
- `recentConversation`
- `coveragePolicy`

### What Output Was Used

Generated questions may be:

- `follow-up`
- `clarification`

The generated follow-up is stored with its `parentQuestionId`.

### Files Changed/Used

- `backend/src/services/aiInterviewerService.js`
- `backend/src/services/interviewService.js`
- `backend/test/interviewApi.test.js`

---

# 8. Answer Evaluation

## Runtime Answer Assessment

- **Date/time:** Original prompt introduced at `2026-08-08 13:55:52 +0530`
- **Introducing commit:** `1f5c951`
- **Current wording updated:** `2026-08-08 15:23:55 +0530`
- **Update commit:** `e77cdb4`
- **Tool:** OpenAI-compatible Chat Completions API.
- **Purpose:** Evaluate a continuing candidate answer before selecting the next question.
- **Prompt:** The exact **Runtime Interviewer Prompt** above. No separate evaluator prompt exists.

### What Output Was Used

The following assessment fields are validated and stored:

- `score`
- `technicalUnderstanding`
- `reasoning`
- `confidence`
- `strengths`
- `weaknesses`
- `missingConcepts`

### Files Changed/Used

- `backend/src/services/aiInterviewerService.js`
- `backend/src/routes/interview.js`
- `backend/src/services/interviewService.js`

---

# 9. Feedback

## Runtime Final-Feedback Prompt

- **Date/time:** `2026-08-08 13:55:52 +0530`
- **Introducing commit:** `1f5c951`
- **Individual model-call timestamps:** Not retained.
- **Tool:** OpenAI-compatible Chat Completions API, called by `structuredCompletion`.
- **Purpose:** Generate grounded, structured feedback after interview completion.

### Verbatim Prompt

```text
You are an AI interview evaluator. Return JSON only with: overallScore, technicalKnowledge, problemSolving, reasoning, communication, strengths, weaknesses, topicsToRevise, recommendations, curriculumCoverage, questionPerformance. Claims must be grounded in answers. Scores 0-100. Do not reveal private chain-of-thought.
```

### What Output Was Used

The application validates and uses:

- `overallScore`
- `technicalKnowledge`
- `problemSolving`
- `reasoning`
- `communication`
- `strengths`
- `weaknesses`
- `topicsToRevise`
- `recommendations`
- `curriculumCoverage`
- `questionPerformance`

The result is returned through:

```http
POST /api/interview/feedback
```

and rendered in the interview report.

### Files Changed/Used

- `backend/src/services/aiInterviewerService.js`
- `backend/src/routes/interview.js`
- `frontend/src/hooks/useInterviewSession.js`
- `frontend/src/pages/Results.jsx`

---

# 10. Testing

## Automated Interview Tests

- **Date/time:** Not applicable
- **Tool:** Node.js test runner and mocked `fetch`
- **Purpose:** Exercise candidate profiles, curriculum eligibility, answer-driven follow-up transport, question coverage and final feedback API flow.
- **Prompt:** None.
- **Output used:** Test assertions and pass/fail results.

### Files Changed/Used

- `backend/test/interviewApi.test.js`
- `backend/test/candidateCurriculum.test.js`
- `backend/test/interviewSession.test.js`

No natural-language AI testing prompt was retained.

---

# 11. Repository Development Evidence

Git history is included as **implementation evidence**. It is not treated as proof of the exact AI prompt used.

## Commit `e022faf` — Interview Question 01

- **Date/time:** `2026-08-08 22:26:42 +0530`
- **Author:** Abhay Mahesh Patil
- **Commit message:** `Interview Question 01`
- **AI prompt:** Not retained.
- **Type:** Interview implementation/debugging.

### Files changed

```text
backend/src/routes/interview.js
backend/src/server.js
backend/src/services/aiInterviewerService.js
backend/test/interviewApi.test.js
frontend/src/hooks/useInterviewSession.js
frontend/src/pages/Results.jsx
```

### Repository evidence

The commit modified the interview route, server, AI interviewer service, interview API test, interview session hook and results page.

---

## Commit `7386066` — Update interview agent changes

- **Date/time:** `2026-08-09 14:27:04 +0530`
- **Author:** Abhay Mahesh Patil
- **Commit message:** `Update interview agent changes`
- **AI prompt:** Not retained.
- **Type:** Major interview-agent update.

### Files changed

```text
backend/src/routes/interview.js
backend/src/services/aiInterviewerService.js
backend/src/services/interviewService.js
backend/test/interviewApi.test.js
data/interview-questions.json
frontend/src/hooks/useInterviewSession.js
frontend/src/pages/Interview.jsx
frontend/src/pages/InterviewSetup.jsx
frontend/src/pages/Results.jsx
frontend/src/services/api.js
frontend/src/services/interviewService.js
```

### Repository evidence

The commit contained major changes to:

- AI interviewer logic
- Interview session logic
- Interview API
- Interview question data
- Interview setup
- Interview UI
- Results
- Frontend API communication
- Automated tests

The commit included:

```text
604 insertions
199 deletions
```

---

## Commit `c93dbf7` — Updated changes

- **Date/time:** `2026-08-09 16:01:20 +0530`
- **Author:** Ayush
- **Commit message:** `updated changes`
- **AI prompt:** Not retained.
- **Type:** Project update.

### Files changed

```text
backend/The Interview Agent.txt
backend/src/server.js
package-lock.json
```

The commit included:

```text
480 insertions
1 deletion
```

The newly added:

```text
backend/The Interview Agent.txt
```

contains 151 added lines according to the Git history provided for this log.

---

# 12. Git & GitHub Workflow

- **Tool:** ChatGPT / Codex / Git
- **Date/time:** Individual prompts not retained.
- **Purpose:** Git workflow, meaningful commits, synchronization and conflict resolution.
- **Prompt:** Exact prompts not retained.
- **Verified activities:**
  - `git status`
  - `git diff --cached`
  - `git log`
  - `git push`
  - Remote synchronization
  - `git pull --rebase`
  - Rebase conflict resolution

A remote/local synchronization issue occurred because the remote branch was ahead.

A conflict occurred in:

```text
backend/src/server.js
```

The conflict involved:

- Agent route registration
- Interview route registration
- Environment loading
- Test-mode server startup
- Express app export

Git history was later used to verify the resulting implementation.

---

# 13. Environment & API-Key Configuration

## AI Provider Configuration

- **Tool:** ChatGPT / Codex
- **Date/time:** Not retained.
- **Purpose:** Diagnose AI-provider configuration and secure API-key handling.
- **Prompt:** Exact prompt not retained.

### Verified development topics

- `AI_API_KEY`
- `process.env.AI_API_KEY`
- Backend-only credentials
- `.env`
- `.env.example`
- `.gitignore`
- AI-provider authentication
- Frontend/backend separation

### Security principle

```text
API Key
   ↓
Backend Environment
   ↓
AI Provider
```

The API key should not be exposed in frontend code or committed to GitHub.

---

# 14. Backend Runtime Troubleshooting

## Port Conflict

- **Tool:** ChatGPT / Codex
- **Prompt:** Exact prompt not retained.
- **Issue:**

```text
EADDRINUSE: address already in use :::5000
```

This indicates that another process was already using port `5000`.

---

# 15. AI Configuration Troubleshooting

## “AI interviewer is not configured.”

- **Tool:** ChatGPT / Codex
- **Prompt:** Exact prompt not retained.
- **Purpose:** Diagnose why the backend could not make a real AI request.

The troubleshooting covered:

- Correct API-key location
- Backend environment variables
- AI-provider authentication
- Runtime configuration
- Keeping credentials out of frontend code

---

# 16. Chatbot End-to-End Debugging

- **Tool:** ChatGPT / Codex
- **Date/time:** Not retained.
- **Purpose:** Diagnose the conversational interview flow.
- **Prompt:** Exact original prompt not retained.

The retained development record shows debugging around:

- Frontend → backend → AI provider
- Chat state
- API requests
- Session management
- Conversation history
- Candidate context
- Curriculum context
- Adaptive follow-ups
- AI-provider configuration
- Response parsing
- Final feedback
- 8-question requirement
- 4 curriculum-day requirement
- Required API contract
- Frontend tests
- Backend tests

The goal was to identify the actual root cause rather than hide the problem with mock responses.

---

# 17. Claude — Website Debugging

The following Claude prompts were retained from the supplied development history and are reproduced verbatim.

## Prompt 1 — Initial Website Analysis

- **Tool:** Claude
- **Date/time:** Not retained in the supplied history.
- **Purpose:** Analyze the website, fix interview questions, investigate day-related issues, improve UI spacing, and make quotes dynamic.

### Verbatim Prompt

```text
first of analyze zip file, this is website the problems are first of interview question are not coming there is some problems with days i know but also some more problems are tere and also why are there so much space left for that feature boxes make it smaill and good perfect and quotes are not changing dynamically like the same same quotes come always make it like every time there are new quotes and see that it works then only send me new zip file name as ai_agent
```

### Requested work

- Analyze the ZIP/project.
- Investigate missing interview questions.
- Investigate curriculum/day issues.
- Find additional problems.
- Reduce excessive space around feature boxes.
- Improve feature-box layout.
- Make quotes dynamic.
- Avoid repeated quotes.
- Verify changes before producing the ZIP.

### Requested archive

```text
ai_agent.zip
```

---

## Prompt 2 — Continue

- **Tool:** Claude
- **Date/time:** Not retained.

### Verbatim Prompt

```text
Continue
```

This continued the previous analysis and implementation process.

---

## Prompt 3 — Interview Questions Still Not Solved

- **Tool:** Claude
- **Date/time:** Not retained.
- **Purpose:** Re-investigate why interview questions were not appearing.

### Verbatim Prompt

```text
still question problem not solved no question are coming if there is somesetting need to done maually tell or if you cna do it and give me now zip file ai_agent 2
```

### Requested work

1. Re-investigate the interview-question problem.
2. Identify whether manual configuration was required.
3. Apply the fix if possible.
4. Verify the result.
5. Provide the updated project archive.

### Requested archive

```text
ai_agent_2.zip
```

---

## Prompt 4 — Export Claude History

- **Tool:** Claude
- **Date/time:** Not retained.

### Verbatim Prompt

```text
give me promt history to share with chatgpt
```

### Purpose

Transfer the Claude development history into the consolidated AI development log.

### Claude status at export

Claude reported that it was in the middle of modifying:

```text
frontend/src/hooks/useInterviewSession.js
```

The intended modification was an offline fallback interview engine so the interview could work even if the backend never started.

At the time of export:

- The edit had not yet been completed/saved.
- A new `ai_agent_2.zip` had not yet been generated.
- The fallback implementation was still in progress.

Therefore this log does not claim that the fallback was completed at that point.

---

# 18. Presentation Planning

- **Tool:** ChatGPT / Codex
- **Date/time:** Not retained.
- **Purpose:** Prepare the project presentation.
- **Prompt:** Exact prompt not retained.

The retained development record shows assistance with:

- Problem statement
- Literature survey
- User empathy research
- Team learning activities
- Problem-to-requirement mapping
- AI Interview Agent solution
- User journey
- Architecture
- AI functionality
- Technical implementation
- Live demo
- Impact
- Future scope

---

# 19. User Research & Literature Survey

- **Tool:** ChatGPT / Codex
- **Date/time:** Not retained.
- **Purpose:** Structure research evidence for the presentation.
- **Prompt:** Exact prompt not retained.

The retained record shows work around:

- Literature survey
- User empathy survey photographs
- Team learning/research photographs
- Key observations
- Research-to-requirement mapping

The intended progression was:

```text
Research
   ↓
User Observations
   ↓
Requirements
   ↓
Design
   ↓
Implementation
```

---

# 20. Overall AI Development Approach

AI was used as a:

- Planning assistant
- Architecture assistant
- Coding assistant
- Debugging assistant
- Testing assistant
- Documentation assistant
- Git troubleshooting assistant
- Configuration assistant
- Review assistant

The overall development cycle was:

```text
Understand
   ↓
Plan
   ↓
Implement
   ↓
Test
   ↓
Audit
   ↓
Debug
   ↓
Improve
   ↓
Commit
   ↓
Deploy
   ↓
Verify
```

AI-generated suggestions were reviewed and integrated into the project rather than being treated as automatically correct.

The team remained responsible for:

- Reviewing generated code
- Testing functionality
- Resolving implementation issues
- Managing API credentials
- Making final technical decisions
- Maintaining the Git repository
- Verifying the application

---

# 21. Verified AI Prompt Summary

| Area | Tool | Exact prompt retained? | Evidence |
|---|---|---:|---|
| Architecture | ChatGPT / Codex | No | Development records |
| Initial frontend | Emergent | No | Development records |
| Candidate analysis | Application code | N/A | Deterministic code |
| AI interviewer | OpenAI-compatible API | **Yes** | Runtime prompt |
| Follow-up | OpenAI-compatible API | **Yes — same interviewer prompt** | Runtime prompt |
| Answer evaluation | OpenAI-compatible API | **Yes — same interviewer prompt** | Runtime prompt |
| Final feedback | OpenAI-compatible API | **Yes** | Runtime prompt |
| Automated testing | Node.js/mock | N/A | Test code |
| Git workflow | ChatGPT / Codex | No | Repository history |
| API-key setup | ChatGPT / Codex | No | Development record |
| Backend debugging | ChatGPT / Codex | No | Development record |
| Claude website debugging | Claude | **Yes** | Supplied Claude history |
| Presentation | ChatGPT / Codex | No | Development record |

---

# 22. Repository Evidence Summary

The following repository commits were directly supplied from Git history and are included as implementation evidence:

```text
e022faf  2026-08-08 22:26:42 +0530
Interview Question 01
Author: Abhay Mahesh Patil

7386066  2026-08-09 14:27:04 +0530
Update interview agent changes
Author: Abhay Mahesh Patil

c93dbf7  2026-08-09 16:01:20 +0530
updated changes
Author: Ayush
```

These commits demonstrate continued development of the interview agent and should be read together with the exact runtime prompts and retained AI development records.

---

# 23. Transparency Note

This AI log intentionally does **not** fabricate missing prompts.

Where a verbatim prompt is available, it is reproduced as a prompt record.

Where only the purpose, output or repository evidence is available, the activity is documented as a summary and the prompt is marked **Not retained**.

Where the application performed deterministic processing without a model call, the record explicitly states **Prompt: None**.

Git commits document what changed in the repository, but they do not by themselves prove which AI prompt caused a change.

Claude prompts supplied from retained development history are preserved separately from repository-runtime prompts.

This document is therefore intended to provide a traceable and honest record of AI-assisted development rather than a reconstructed history of prompts that were not actually retained.
