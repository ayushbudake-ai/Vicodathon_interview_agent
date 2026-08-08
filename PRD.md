# SignalRoom AI Interview Agent PRD

## Original problem statement
Build a polished frontend-first AI Interview Agent prototype with React, Tailwind CSS, React Router, Framer Motion, Lucide icons, mock data only, and no backend/auth/database/real AI APIs. The landing page opens first with Start Interview as the primary action.

## Architecture decisions
- React single-page application with React Router routes for landing, candidates, interview, feedback, curriculum, documentation, about, profile, settings, and 404.
- Local mock data is separated in ; UI and interaction state remain local in .
- Visual system follows SignalRoom design guidelines: dark ink surfaces, warm paper accents, Swiss editorial layout, Bodoni Moda display type, IBM Plex Sans/Mono metadata, restrained signal colors.
- No network calls, backend endpoints, authentication, database, or external AI integrations.

## User personas
- Technical candidates preparing for AI engineering interviews.
- Coaches and hiring teams reviewing readiness and weak areas.

## Core requirements (static)
- Landing page with product narrative, demo transcript, feature cards, how-it-works, footer, and Start Interview CTA.
- Candidate selection with cohort progress, modules, streak, hours, weak areas, and resume context.
- Eight-question adaptive interview experience covering RAG, vector databases, prompt engineering, agentic AI, MCP, deployment, production systems, and systems thinking.
- Typing indicator, local answer submission, follow-up messages, progress, notes, confidence, timer display, and curriculum coverage.
- Feedback with scores, strengths, weaknesses, revision topics, next step, radar visualization, recommendation, restart, and download UI.
- Supporting pages and responsive navigation.

## What has been implemented
- 2026-08-07: Replaced starter screen with complete SignalRoom frontend prototype.
- 2026-08-07: Added reusable navigation/footer, candidate cards, interview shell, feedback sections, curriculum modules, and supporting route templates.
- 2026-08-07: Added motion, responsive styling, accessibility labels, unique data-testid coverage, and mock data separation.
- 2026-08-07: Verified production build, lint, landing CTA, full interview flow, feedback/restart, all routes, mobile navigation, and no horizontal overflow.

## Prioritized backlog
- P0: Connect local mock data contracts to a future backend without changing route/UI contracts.
- P1: Generate a real downloadable report instead of the current UI-only action.
- P1: Replace fixed timer/confidence values with session state and persisted progress.
- P2: Add richer profile editing and user-configurable practice plans.

## P0/P1/P2 remaining and next tasks
- P0 remaining: None for the requested frontend prototype.
- P1 next: Add report generation and real session persistence when backend scope is approved.
- P2 next: Add coach review mode and comparative cohort analytics.

