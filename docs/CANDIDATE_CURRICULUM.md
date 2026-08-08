# Candidate and Curriculum Analysis

This layer determines the curriculum topics a candidate has actually completed. It does not generate interview questions or make interview-planning decisions.

## Source data and mapping

- `data/candidates.json` stores `{ candidates: [{ member, missions, signals }] }`. Each mission has a day and title, with optional `passed`, `skipped`, and `attempts` fields. `signals` is retained as the candidate's learning signals.
- `data/curriculum.json` is an array of documented curriculum days. Its current schema is `{ day, title, topics, done }`. It currently documents eight days; it does not contain learning-objective or tools fields.
- A passed, non-skipped mission is eligible only when its day exists in the curriculum data. This intentionally excludes unknown curriculum days instead of guessing their content.

## Services

`CandidateAnalyzer` (`backend/src/candidate/candidateAnalyzer.js`) accepts a candidate ID and returns normalized data, including completed and skipped days, completed missions, attempts keyed by day, and the original learning signals.

`CurriculumService` (`backend/src/curriculum/curriculumService.js`) returns all documented days, finds a day, topic string, or module title. Learning objectives are `null` and tools are `[]` because neither exists in the source JSON.

`getEligibleTopics` and `analyzeCandidateCurriculum` (`backend/src/analysis/eligibleTopicService.js`) join the two layers. A skipped mission, failed mission, or mission whose day is absent from the curriculum cannot become an eligible topic.

## Example normalized analysis

```json
{
  "candidate": {
    "candidateId": "CAND-001",
    "completedDays": [7, 8, 10],
    "skippedDays": [29],
    "attempts": { "10": 2 },
    "learningSignals": { "commitDays": 28 }
  },
  "eligibleTopics": [{
    "day": 10,
    "topic": "Hybrid retrieval and relevance tuning",
    "module": "Retrieval & Matching Engine",
    "learningObjective": null,
    "tools": [],
    "completed": true,
    "attempts": 2,
    "skipped": false
  }]
}
```

The API exposes this read-only analysis at `GET /api/interview/candidates/:candidateId/analysis`. An unknown candidate returns `404`.
