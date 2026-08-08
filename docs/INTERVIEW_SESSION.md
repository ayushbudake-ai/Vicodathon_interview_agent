# Interview Session and Conversation Context

The session layer stores interview state and context. It does not generate AI questions.

```text
Candidate
   ↓
Candidate Analysis
   ↓
Eligible Curriculum Topics
   ↓
Interview Session
   ↓
Question
   ↓
Candidate Answer
   ↓
Conversation Context
   ↓
Future AI Follow-up
```

## Session service

`InterviewSessionService` in `backend/src/services/interviewService.js` keeps sessions in an in-memory `Map`. A session contains `sessionId`, `candidateId`, `startedAt`, `status`, `questions`, `answers`, `evaluations`, `topicsCovered`, `curriculumDaysCovered`, `currentQuestion`, `currentTopic`, `questionCount`, and `followUpCount`.

Sessions begin in `created`, the existing `/api/interview/start` route marks them `active`, and `completeSession` marks them `completed`. Completed sessions reject new questions and answers. Missing session IDs safely return `null`.

## Questions, answers, and coverage

`addQuestion` stores caller-provided metadata: `id`, `text`, `curriculumDay`, `topic`, `type`, `difficulty`, `isFollowUp`, and a generated `createdAt` timestamp. It records unique topics and curriculum days exactly when questions are added. An `isFollowUp: true` question increments `followUpCount`; no follow-up decision logic is included.

`addAnswer` preserves the original answer text with its `questionId` and `answeredAt` timestamp. Questions and answers are append-only arrays, retaining chronological order.

`getConversationContext` returns prior questions and answers, discussed topics, unique curriculum days, evaluations, the current question and topic, and the follow-up count. This is the hand-off surface for a future AI interviewer.

The service records state only. Candidate eligibility remains the responsibility of `CandidateAnalyzer`, `CurriculumService`, and `EligibleTopicService` from Step 3.
