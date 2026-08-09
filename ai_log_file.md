1. AI Usage Log

## Project

**AI Interview Agent — ABTalks Vibe Code Hackathon**

## AI Tool Used

**ChatGPT**

2.Purpose

We used ChatGPT mainly as a development and planning assistant while working on the AI Interview Agent. It helped us understand the hackathon requirements, think through the product idea, plan the system architecture, divide the work between team members, and organize our development process.

---

Session 1 — Understanding the Hackathon Rules

We first used ChatGPT to understand how the hackathon evaluation works and what could cause a submission to be rejected.

It helped us understand:

* The eligibility requirements.
* The authenticity review.
* How the judging process works.
* What happens in the Live Steer Challenge.
* Why we need a public repository and working demo.
* Why maintaining a genuine Git history and AI usage records is important.

This helped us plan our development process before starting the actual implementation.

---

Session 2 — Planning Our AI-Assisted Workflow

We discussed how our three-person team could divide the work and use AI efficiently.

ChatGPT suggested separating the work into:

* Frontend and UI development.
* Backend and API development.
* AI logic, integration, testing, and documentation.

We also discussed building the project feature by feature instead of trying to generate the entire application at once.

Another important recommendation was to make regular, meaningful Git commits throughout development rather than creating one large commit at the end.

---
Session 3 — Choosing the Problem

We discussed the available problem statements and decided to work on the **AI Interview Agent**.

ChatGPT helped us break down what the problem was actually asking for.

The main idea we identified was:

> Build the interviewer, not just a list of interview questions.

We identified the key capabilities the product should demonstrate:

* A real multi-turn conversation.
* Questions based on the candidate's learning journey.
* Adaptive questioning.
* Intelligent follow-up questions.
* Memory of previous answers.
* Candidate-specific assessment.
* Useful feedback at the end.

---

Session 4 — Planning the Interview Agent

We then discussed how the AI Interview Agent could be structured internally.

ChatGPT suggested breaking the system into smaller responsibilities instead of having one large AI prompt handle everything.

The planned components include:

* Candidate profile analysis.
* Curriculum retrieval.
* Interview planning.
* Question generation.
* Follow-up question generation.
* Answer evaluation.
* Conversation memory.
* Final feedback generation.

The goal is to use the candidate's completed topics and previous answers to make the interview feel personalized instead of following a fixed questionnaire.

---

Session 5 — Checking the Minimum Requirements

We used ChatGPT to go through the official requirements one by one and make sure we understood what our application needs to do.

The requirements we identified were:

* Conduct a conversational technical interview.
* Ask at least 8 questions.
* Cover at least 4 different curriculum days.
* Generate follow-up questions based on previous answers.
* Maintain conversation context.
* Generate structured feedback at the end.
* Expose the required HTTP endpoint from the Technical Specification.

We also decided that the interview should react to the candidate's answers.

For example:

* A strong answer can lead to a deeper technical question.
* A weak answer can lead to a clarification or foundational question.
* Previous answers should influence what the interviewer asks next.

This is important because we want the experience to feel like an actual technical interview rather than a scripted quiz.

---

## Session 6 — Planning the Website Experience

Before focusing on the full backend and AI implementation, we planned the complete user experience.

The planned flow is:

1. Landing page.
2. Candidate selection.
3. Candidate profile and progress.
4. Interview dashboard.
5. Multi-turn interview.
6. Final evaluation and feedback.

We also planned features such as:

* Candidate progress.
* Curriculum coverage.
* Interview progress.
* Current interview topic.
* Skills being evaluated.
* Chat-based conversation.
* Follow-up questions.
* Strengths and weaknesses.
* Recommended areas for improvement.

For the initial interface, we planned to use realistic mock data so that the complete user journey could be tested before connecting all the real AI functionality.

---

Session 7 — GitHub and Documentation

We also used ChatGPT to understand how we should organize the repository for the hackathon.

The main recommendations were:

* Keep the repository public.
* Make regular and meaningful commits.
* Avoid putting the entire project into one final commit.
* Maintain a clear README.
* Maintain `PROMPTS.md` with the actual prompts used during development.
* Maintain this AI Usage Log.
* Keep the documentation consistent with the actual development process.

---

3.How We Used AI

ChatGPT was used as an assistant for planning, understanding requirements, architecture discussions, and development guidance.

The team is responsible for reviewing the suggestions, integrating the relevant ideas into the project, testing the implementation, and making the final development decisions.

We are keeping the AI usage documentation updated throughout the hackathon rather than creating the history after development is finished.

## Current Status

At this stage, we have:

* Understood the hackathon requirements.
* Selected the AI Interview Agent problem.
* Identified the core interview functionality.
* Planned the system architecture.
* Planned the website and user flow.
* Divided the development responsibilities.
* Set up our approach for Git and AI documentation.

The next development stages are focused on implementing the actual interview agent, backend API, curriculum and candidate data integration, adaptive questioning, conversation context, answer evaluation, and structured final feedback.

Prompt Records

Detailed prompts used during development are maintained separately in `PROMPTS.md`.

The prompt records correspond to the actual AI interactions used during the project and will be updated throughout development.
