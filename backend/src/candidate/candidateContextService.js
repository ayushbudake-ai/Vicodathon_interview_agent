/** Derives interview context directly from supplied candidate mission signals. */
export function buildCandidateInterviewContext(candidate) {
  if (!candidate?.member) return null;
  const missions = Array.isArray(candidate.missions) ? candidate.missions : [];
  const completed = missions.filter((mission) => mission.passed === true && !mission.skipped);
  const skipped = missions.filter((mission) => mission.skipped || mission.passed === false);
  const weak = missions.filter((mission) => mission.skipped || mission.passed === false || (mission.attempts || 0) >= 4);
  const strengths = completed.filter((mission) => (mission.attempts || 0) <= 2);
  const summarize = (mission) => ({ day: mission.day, topic: mission.title, attempts: mission.attempts ?? null });
  return {
    id: candidate.member.id, name: candidate.member.name,
    completedTopics: completed.map(summarize), skippedTopics: skipped.map(summarize),
    attempts: Object.fromEntries(missions.filter((mission) => Number.isFinite(mission.day) && mission.attempts !== undefined).map((mission) => [mission.day, mission.attempts])),
    learningSignals: candidate.signals || {}, strengths: strengths.map(summarize), weakAreas: weak.map(summarize)
  };
}
