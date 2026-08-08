/**
 * @typedef {Object} CandidateProfile
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} education
 * @property {number} experience
 * @property {string} status
 * @property {string[]} weak
 * @property {string} bio
 */

/**
 * @typedef {Object} CurriculumDay
 * @property {number} day
 * @property {string} title
 * @property {string} topics
 * @property {boolean} done
 */

/**
 * @typedef {Object} InterviewSession
 * @property {string|null} candidateId
 * @property {string|null} sessionId
 * @property {Array<InterviewQuestion>} questionsAsked
 * @property {Array<{questionId:string, answer:string, createdAt:string}>} answers
 * @property {number[]} coveredDays
 * @property {Array<{role:string, content:string, questionId?:string, questionType?:string, day?:number, topic?:string, order:number}>} conversationHistory
 * @property {string|null} currentQuestion
 * @property {string|null} currentTopic
 * @property {string} interviewStatus
 * @property {Array<Record<string, unknown>>} evaluations
 * @property {Record<string, unknown>|null} finalFeedback
 */

/**
 * @typedef {Object} InterviewQuestion
 * @property {string} id
 * @property {number} day
 * @property {string} topic
 * @property {string} question
 * @property {"primary"|"follow-up"} type
 * @property {"foundation"|"intermediate"|"advanced"} difficulty
 * @property {string=} parentQuestionId
 */

/**
 * @typedef {Object} CandidateAnswer
 * @property {string} questionId
 * @property {string} answer
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AnswerEvaluation
 * @property {number} score
 * @property {string[]} strengths
 * @property {string[]} gaps
 */

/**
 * @typedef {Object} InterviewFeedback
 * @property {number} overall
 * @property {Array<string>} strengths
 * @property {Array<string>} gaps
 * @property {string} nextStep
 */

export const interviewStatuses = Object.freeze({
  idle: "idle",
  active: "active",
  complete: "complete"
});
