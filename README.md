# AI Interview Agent

> **Build the interviewer, not the interview.**

An AI-powered technical interview agent that conducts **personalized, multi-turn interviews based on a candidate's learning journey**.

The system analyzes a candidate's completed curriculum, skipped topics, learning progress, and available learning signals before generating an interview. During the interview, it maintains conversation context, evaluates answers, generates adaptive follow-up questions, and produces structured feedback at the end.

---

## 🎯 Challenge

The project is built for the **ViCodathon AI Interview Agent challenge**.

The challenge requires an AI agent capable of conducting a realistic technical interview that:

* Assesses the candidate's understanding of completed concepts
* Adapts throughout the conversation
* Generates intelligent follow-up questions
* Maintains context
* Provides actionable feedback
* Uses the candidate's learning journey for personalization

The challenge requires a minimum of **8 questions covering at least 4 different curriculum days**.

---

## ✨ Key Features

### Candidate-Aware Interview

The interview is generated using candidate-specific learning information, including:

* Completed curriculum
* Completed missions
* Skipped topics
* Attempts
* Learning signals

This prevents the interview from being a generic fixed questionnaire.

### Curriculum-Aware Question Generation

Questions are generated from eligible curriculum topics rather than randomly selecting unrelated technical questions.

Skipped topics are excluded from the eligible interview scope.

### Adaptive Follow-Up Questions

The agent analyzes the candidate's previous answer and can generate a follow-up question based on the response.

The follow-up is connected to the previous interview question and continues the conversation naturally.

### Conversation Context

The interview maintains the context of:

* Previous questions
* Candidate answers
* Follow-up questions
* Topics discussed
* Evaluation information

This allows later questions to consider earlier responses.

### AI-Based Answer Evaluation

Candidate responses are evaluated based on the interview context and the expected technical topic.

The system does not rely on a single hardcoded final score.

### Structured Feedback

At the end of the interview, the system generates structured feedback including:

* Overall score
* Competency-level evaluation
* Topic performance
* Strengths
* Weaknesses
* Areas for improvement
* Personalized recommendations
* Evidence from the interview

### Evaluation Assistant

The results experience allows the candidate to understand their evaluation and explore why particular scores or recommendations were produced.

---

## 🧠 Interview Flow

```text
Candidate
   │
   ▼
Candidate Profile
   │
   ▼
Candidate + Curriculum Analysis
   │
   ▼
Eligible Topics
   │
   ▼
Interview Initialization
   │
   ▼
AI Question Generation
   │
   ▼
Candidate Answer
   │
   ▼
Answer Evaluation
   │
   ├──────────────► Follow-up Question
   │                       │
   │                       ▼
   │                 Candidate Answer
   │
   ▼
Continue Interview
   │
   ▼
Structured Evaluation
   │
   ▼
Results + Feedback
```

---

## 🏗️ Architecture

### Frontend

* React
* Vite
* Modern component-based UI
* Interview session interface
* Progress tracking
* Results dashboard

### Backend

* Node.js
* Express
* REST API
* Candidate analysis
* Curriculum analysis
* Interview session management
* Question generation
* Follow-up generation
* Answer evaluation
* Feedback generation

### AI

The application uses an AI model to support:

* Interview question generation
* Adaptive follow-ups
* Candidate answer evaluation
* Structured feedback

### Data

The project uses the synthetic curriculum and candidate data supplied for the hackathon.

---

## 📋 Challenge Requirement Coverage

| Requirement                        | Implementation |
| ---------------------------------- | -------------- |
| Conversational technical interview | ✅              |
| Minimum 8 questions                | ✅              |
| At least 4 curriculum days         | ✅              |
| Adaptive follow-up questions       | ✅              |
| Conversation context               | ✅              |
| Structured final feedback          | ✅              |
| Candidate personalization          | ✅              |
| Curriculum-based questions         | ✅              |
| Skipped-topic handling             | ✅              |
| AI-based answer evaluation         | ✅              |
| HTTP API                           | ✅              |

---

## 📊 Interview Results

The results interface provides evaluation across multiple competency dimensions, including:

1. Technical Knowledge
2. Problem Solving
3. System Design
4. Production Thinking
5. Communication
6. Practical Experience

The results also provide topic-level performance, strengths, weaknesses, and recommended focus areas.

---

## 🔌 API

The backend exposes REST endpoints for the interview lifecycle.

Core interview operations include:

```text
POST /api/interview/start
POST /api/interview/answer
POST /api/interview/feedback
GET  /api/interview/:sessionId
```

Refer to the backend routes and project documentation for the current request and response formats.

---

## 🧪 Testing

The project includes automated tests covering important interview and candidate/curriculum functionality.

Run the backend tests with:

```bash
cd backend
npm install
npm test
```

---

## 🚀 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/ayushbudake-ai/Vicodathon_interview_agent.git
cd Vicodathon_interview_agent
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create the required `.env` file in the backend directory and configure the AI/API settings required by the project.

Do not commit API keys or other secrets to GitHub.

### 4. Start the backend

```bash
npm run dev
```

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

---

## 🔐 Environment Variables

Secrets must be stored in environment variables rather than committed to the repository.

Example:

```env
AI_API_KEY=your_api_key_here
```

Use the actual environment variable names defined by the project configuration.

---

## 🤖 AI Usage

AI tools were used throughout development for:

* Architecture planning
* Feature implementation
* Debugging
* Testing
* Documentation
* Interview-flow development
* Evaluation logic
* UI improvements

A detailed AI usage history is maintained in:

* `AI_USAGE_LOG.md`
* `PROMPTS.md`

The AI usage documentation is intended to provide transparency into how AI-assisted development contributed to the project.

---

## 📁 Project Documentation

| File              | Purpose                          |
| ----------------- | -------------------------------- |
| `README.md`       | Project overview and setup       |
| `PROMPTS.md`      | Prompt history                   |
| `AI_USAGE_LOG.md` | AI-assisted development log      |
| `PRD.md`          | Product requirements             |
| `docs/`           | Additional project documentation |

---

## 👥 Team

**ViCodathon Team**

* Ayush Budake
* Abhay Patil
* Shreeya Patil

---

## 🏁 Submission

This repository contains the implementation of the AI Interview Agent developed for the ViCodathon challenge.

The project focuses on making the interview **candidate-aware, curriculum-aware, adaptive, contextual, and evidence-based** rather than a static list of predefined questions.
