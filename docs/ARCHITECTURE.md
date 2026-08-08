# Architecture Overview

## Frontend structure
- The existing UI remains intact and is routed through the same pages: landing, candidate selection, interview setup, interview room, completion, and results.
- Shared app state now flows through a lightweight interview context backed by a dedicated hook.
- New folders were added to keep future work organized without duplicating existing components:
  - components/ for presentational UI pieces
  - context/ for app-wide session state
  - hooks/ for interview-session behavior
  - services/ for API access
  - types/ for shared data contract annotations
  - utils/ for state helpers

## Backend structure
- The backend keeps the existing session-based behavior and now routes responsibilities through a small service layer.
- The interview router handles request entry points for starting a session, recording answers, and producing feedback placeholders.
- The interview service manages in-memory session state so future persistence can be introduced without changing the public shape immediately.

## AI agent structure
- The AI agent folder now exposes a planner module that can later grow into separate responsibilities:
  - Interview Planner: select eligible curriculum topics and plan progression.
  - AI Interviewer: generate prompts and follow-up questions.
  - Answer Evaluator: score answers and identify strengths and gaps.
  - Feedback Generator: shape the final feedback payload.
- The current implementation only provides the planning scaffold and placeholder structure.

## Data flow
1. Candidate selection stores the chosen candidate id in browser storage.
2. The interview context loads the candidate and initializes the interview session state.
3. The interview flow records answers, drives the question progression, and exposes the current topic timeline.
4. The frontend can later call the backend service layer for session persistence and evaluation hooks without changing the page experience.

## Interview flow
- Landing -> Candidate selection -> Interview setup -> Interview room -> Completion -> Results.
- The current flow uses the existing mock questions, follow-ups, and results display.
- The session shape now supports future fields such as candidate id, session id, question history, topic coverage, evaluations, and final feedback.

## Responsibilities
- Frontend pages: keep the UI and navigation stable.
- Interview context and hook: manage session state and conversation progression.
- API service layer: prepare for real backend calls without forcing a new contract.
- Backend routes/services: manage interview lifecycle placeholders.
- AI agent planner: prepare future interview planning logic around the existing candidate and curriculum data.
