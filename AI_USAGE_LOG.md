AI Usage Log
Project

AI Interview Agent — ABTalks Vibe Code Hackathon

This document records significant AI-assisted development activities used while building the project.

1. Project Planning

Tool: ChatGPT
Purpose: Analyze the Interview Agent problem statement and identify required functionality.

Work performed:

Analyzed the AI Interview Agent challenge.
Identified the mandatory requirements:
Conversational technical interview
Minimum 8 questions
At least 4 curriculum days
Adaptive follow-up questions
Conversation context
Structured final feedback
Required HTTP API
Identified the difference between a scripted questionnaire and an adaptive AI interviewer.

Output used: Project architecture and development plan.

2. Prototype Architecture Planning

Tool: ChatGPT
Purpose: Design the initial architecture and divide responsibilities between team members.

Work performed:

Proposed separation into:
Frontend
Backend
AI Agent
Curriculum data
Candidate data
Defined responsibilities for frontend, backend, and AI/agent development.

Output used: Development structure and team role division.

3. Frontend Prototype Generation

Tool: Emergent
Purpose: Generate the initial AI Interview Agent frontend prototype.

Work performed:

Created landing page.
Created candidate selection interface.
Created interview setup screen.
Created interview chat interface.
Created interview progress UI.
Created feedback/results interface.
Added curriculum and candidate information displays.
Added responsive styling and interactive UI elements.

Output used: Existing frontend prototype.

4. Project Integration

Tool: ChatGPT + VS Code
Purpose: Organize the AI Interview Agent project and integrate existing project resources.

Work performed:

Organized frontend, backend, AI-agent, data, and documentation areas.
Integrated candidate and curriculum resources.
Preserved the existing interview UI while preparing the project for backend and AI integration.

Output used: Current project structure.

5. Git Repository Setup

Tool: VS Code Terminal + Git
Purpose: Establish version control and maintain development history.

Work performed:

Initialized/verified Git repository.
Connected local project to the public GitHub repository.
Resolved the initial remote/local repository history conflict.
Preserved the local project files while merging the remote repository history.

Output used: Public Git repository and development history.

6. Planned AI Interviewer Implementation

Tool: ChatGPT
Purpose: Design the real adaptive interview agent.

Planned functionality:

Candidate profile analysis.
Curriculum-aware question selection.
Adaptive difficulty.
Answer evaluation.
Dynamic follow-up generation.
Conversation memory.
Structured final feedback.

Status: Planned / implementation in progress.

7. Planned Candidate Analysis Layer

Tool: ChatGPT
Purpose: Design candidate-aware interview selection.

Planned functionality:

Read completed missions.
Read attempts.
Read skipped topics.
Read learning signals.
Exclude incomplete/skipped topics.
Select eligible curriculum topics.

Status: Planned / implementation in progress.

8. Planned Answer Evaluation

Tool: ChatGPT
Purpose: Design candidate answer evaluation.

Planned evaluation dimensions:

Technical accuracy
Conceptual understanding
Depth
Reasoning
Practical application
Trade-off awareness
Communication clarity

Status: Planned / implementation in progress.

9. Planned Feedback Generation

Tool: ChatGPT
Purpose: Design personalized final interview feedback.

Planned output:

Overall score
Technical knowledge
Problem solving
Reasoning
Communication
Strengths
Weaknesses
Topics to revise
Recommended next steps

Status: Planned / implementation in progress.

AI Development Principles

Throughout development:

AI-generated code is reviewed by the team.
Generated functionality is tested locally before being accepted.
API keys and secrets are not hardcoded.
Existing working functionality is preserved whenever possible.
AI is used as a development assistant rather than as a replacement for testing and verification.
