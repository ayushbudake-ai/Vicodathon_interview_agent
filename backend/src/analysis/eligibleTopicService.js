import { candidateAnalyzer } from "../candidate/candidateAnalyzer.js";
import { curriculumService } from "../curriculum/curriculumService.js";

/**
 * Joins verified passed missions to documented curriculum days. Missions for
 * undocumented days, failed missions, and skipped missions are never eligible.
 */
export function getEligibleTopics(candidateId, { analyzer = candidateAnalyzer, curriculum = curriculumService } = {}) {
  const candidate = analyzer.analyze(candidateId);
  if (!candidate) return null;

  return candidate.completedMissions.reduce((eligibleTopics, mission) => {
    const curriculumDay = curriculum.getDay(mission.day);
    if (!curriculumDay) return eligibleTopics;

    eligibleTopics.push({
      day: curriculumDay.day,
      topic: curriculumDay.topics,
      module: curriculumDay.title,
      learningObjective: curriculum.getLearningObjectiveForDay(curriculumDay.day),
      tools: curriculum.getToolsForDay(curriculumDay.day),
      completed: true,
      attempts: mission.attempts ?? null,
      skipped: false,
      learningSignals: candidate.learningSignals
    });
    return eligibleTopics;
  }, []);
}

export function analyzeCandidateCurriculum(candidateId, dependencies) {
  const candidate = (dependencies?.analyzer || candidateAnalyzer).analyze(candidateId);
  if (!candidate) return null;

  return { candidate, eligibleTopics: getEligibleTopics(candidateId, dependencies) };
}
