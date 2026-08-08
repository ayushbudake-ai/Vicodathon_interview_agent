# AI Interview Agent — Merged Hackathon Workspace

This workspace combines the polished AI Interview Agent UI with the supplied ViCod candidate/curriculum assets.

## What was merged

- AI Interview UI: landing, setup, interview room, completion and results/report experience.
- ViCod assets: candidate profiles, curriculum topics, 8-question interview thread, candidate learning signals and backend architecture notes.
- Candidate selection page using the supplied synthetic candidate data.
- Candidate-aware setup and interview context.
- Separate backend starter for session APIs.
- Separate AI-agent planning module.
- Role-based folders for a three-person team.

## Run the website

The interview screen, quotes, and feedback all call the backend API — **the backend must be
running or the app will not work** (you'll see "AI interviewer is not configured" / questions
won't load / the interview will get stuck at "Question 0 / 8").

The easiest way is to run both from the project root:

```bash
npm install
npm run dev
```

This installs and starts the backend (port 5000) and frontend (port 5173) together. Open the
Vite URL shown in the terminal (usually `http://localhost:5173`).

### Running them separately

Terminal 1 — backend (required):

```bash
cd backend
npm install
copy .env.example .env    # Windows (PowerShell/cmd)
# cp .env.example .env    # macOS/Linux
npm run dev
```

`AI_API_KEY` can be left empty — the app runs fully on built-in, randomized fallback questions,
quotes, and feedback when no key is set. Only set `AI_API_KEY` if you want live model-generated
questions instead.

Backend health check: `http://localhost:5000/api/health`

Terminal 2 — frontend:

```bash
cd frontend
npm install
npm run dev
```

## Project roles

See `docs/TEAM_ROLES.md`.

## Important hackathon requirement

This is the merged working prototype/workspace. The real AI model, exact Technical Specification contract, and production persistence should be connected after the attached Technical Specification is confirmed. Do not claim the mock interview logic is the final autonomous implementation.

## Authenticity

Keep `PROMPTS.md` and `AI_USAGE_LOG.md` updated with the team's real prompts and AI-assisted changes. Make meaningful Git commits during development.
