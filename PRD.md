# Product Requirements Document — AI Interview Agent

## 1. Product Overview

The AI Interview Agent is a personalized technical interview system designed to evaluate candidates based on their learning journey through the AI Cohort.

Instead of presenting every candidate with the same predefined questionnaire, the system analyzes the candidate's learning progress and generates an interview around eligible curriculum topics.

The agent conducts a multi-turn interview, evaluates candidate responses, generates adaptive follow-up questions, maintains interview context, and produces structured feedback.

---

## 2. Problem Statement

Learners may complete technical projects and curriculum modules but still struggle to explain their work and demonstrate their understanding during technical interviews.

A conventional fixed questionnaire cannot adequately account for:

* What the candidate has learned
* What the candidate has skipped
* Which topics they have practiced
* How well they explain technical concepts
* How they respond to follow-up questions

The product addresses this problem by creating an interview experience that adapts to the individual candidate.

---

## 3. Goals

### Primary Goals

1. Conduct a realistic technical interview.
2. Personalize the interview using candidate learning data.
3. Cover multiple relevant curriculum topics.
4. Ask at least 8 questions.
5. Cover at least 4 curriculum days.
6. Generate adaptive follow-up questions.
7. Maintain conversation context.
8. Evaluate candidate answers.
9. Generate structured feedback.
10. Provide actionable improvement recommendations.

---

## 4. Target User

### Primary User

A learner who has completed portions of the AI Cohort and wants to evaluate their technical understanding and interview readiness.

### Secondary User

A reviewer or evaluator who wants to assess whether the AI agent can conduct a meaningful personalized technical interview.

---

## 5. Core User Journey

```text
Candidate Selection
       ↓
Candidate Profile Analysis
       ↓
Curriculum Eligibility Analysis
       ↓
Interview Initialization
       ↓
Question Generation
       ↓
Candidate Answer
       ↓
Answer Evaluation
       ↓
Adaptive Follow-Up
       ↓
Continue Interview
       ↓
Final Evaluation
       ↓
Results Dashboard
       ↓
Personalized Recommendations
```

---

## 6. Functional Requirements

### FR-01 — Candidate Analysis

The system should analyze candidate learning information before generating the interview.

### FR-02 — Curriculum Analysis

The system should identify curriculum topics eligible for the candidate.

### FR-03 — Personalized Questions

Questions should be generated from relevant curriculum topics.

### FR-04 — Minimum Interview Length

The interview must contain at least 8 questions.

### FR-05 — Curriculum Coverage

Questions must cover at least 4 different curriculum days.

### FR-06 — Adaptive Follow-Ups

The system should generate follow-up questions based on previous candidate responses.

### FR-07 — Context Retention

The system should retain relevant interview context throughout the session.

### FR-08 — Answer Evaluation

Candidate responses should be evaluated in relation to the question and technical topic.

### FR-09 — Structured Feedback

The system should generate structured feedback after the interview.

### FR-10 — Personalized Recommendations

The final results should identify areas where the candidate should improve.

### FR-11 — HTTP API

The backend should expose the required HTTP API for interview functionality.

---

## 7. Results Requirements

The results experience should provide:

* Overall score
* Competency-level scores
* Topic performance
* Strengths
* Weaknesses
* Areas for improvement
* Personalized recommendations
* Evidence from the interview

The implemented competency dimensions include:

1. Technical Knowledge
2. Problem Solving
3. System Design
4. Production Thinking
5. Communication
6. Practical Experience

---

## 8. Non-Functional Requirements

### Reliability

The interview should continue correctly across multiple questions and follow-ups.

### Consistency

The system should maintain relevant context throughout an interview session.

### Security

API keys and secrets must be stored using environment variables and must not be committed to the repository.

### Maintainability

The application should separate candidate analysis, curriculum analysis, interview management, evaluation, and frontend presentation into maintainable components.

---

## 9. Out of Scope

The challenge specification identifies the following as unnecessary for this project:

* Voice interaction
* User authentication
* Persistent user accounts
* Long-term conversation history
* Mobile applications

These features are therefore not required for the submission.

---

## 10. Success Criteria

The project is considered successful when:

* A candidate can start an interview.
* Questions are generated according to the candidate's eligible curriculum.
* The interview reaches the required question count.
* Multiple curriculum days are covered.
* Follow-up questions respond to candidate answers.
* Context is maintained.
* Answers are evaluated.
* Structured feedback is generated.
* The complete frontend-to-backend interview flow works successfully.

---

## 11. Technology

### Frontend

* React
* Vite

### Backend

* Node.js
* Express

### AI

AI model/API integration for:

* Question generation
* Follow-up generation
* Answer evaluation
* Feedback generation

### Development

* Git
* GitHub
* VS Code
* AI-assisted development tools

---

## 12. Project Documentation

Additional documentation is maintained in:

* `README.md`
* `PROMPTS.md`
* `AI_USAGE_LOG.md`
* `docs/`

The documentation should reflect the actual final implementation and development history.
