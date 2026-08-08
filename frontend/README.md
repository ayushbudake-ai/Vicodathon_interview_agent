# AI Cohort — Interview Agent Frontend

Premium dark frontend inspired by the supplied Ofspace-style reference:
- deep navy background
- cyan/blue glow
- subtle technical grid
- thin borders
- rounded cards
- minimal typography
- adaptive interview experience

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Current state

The frontend is intentionally working with mock interview data so it can be built before the backend contract is connected.

Main routes:
- `/` Landing
- `/setup` Interview setup
- `/interview` Interview room
- `/complete` Completion
- `/results` Report

## Backend integration

When the backend API is finalized, replace the mock `submitAnswer` and interview state in:

`src/context/InterviewContext.jsx`

with calls from:

`src/services/api.js`

The UI and route structure can remain the same.
