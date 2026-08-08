import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data");

function loadCandidates() {
  return JSON.parse(fs.readFileSync(path.join(dataDirectory, "candidates.json"), "utf8")).candidates;
}

/** Normalizes the supplied candidate profile without changing the source data. */
export class CandidateAnalyzer {
  constructor(candidates = loadCandidates()) {
    this.candidates = Array.isArray(candidates) ? candidates : [];
  }

  getCandidate(candidateId) {
    return this.candidates.find((candidate) => candidate?.member?.id === candidateId) || null;
  }

  analyze(candidateId) {
    const candidate = this.getCandidate(candidateId);
    if (!candidate) return null;

    const missions = Array.isArray(candidate.missions) ? candidate.missions : [];
    const completedMissions = missions.filter((mission) => mission?.passed === true && mission?.skipped !== true);
    const skippedMissions = missions.filter((mission) => mission?.skipped === true);

    return {
      candidateId: candidate.member?.id,
      name: candidate.member?.name,
      completedMissions: completedMissions.map(({ day, title, attempts }) => ({ day, title, ...(attempts !== undefined ? { attempts } : {}) })),
      completedDays: [...new Set(completedMissions.map((mission) => mission.day).filter(Number.isFinite))].sort((a, b) => a - b),
      skippedDays: [...new Set(skippedMissions.map((mission) => mission.day).filter(Number.isFinite))].sort((a, b) => a - b),
      skippedTopics: skippedMissions.map((mission) => mission.title).filter(Boolean),
      attempts: Object.fromEntries(missions.filter((mission) => Number.isFinite(mission?.day) && mission.attempts !== undefined).map((mission) => [mission.day, mission.attempts])),
      learningSignals: candidate.signals || {}
    };
  }
}

export const candidateAnalyzer = new CandidateAnalyzer();

export function analyzeCandidate(candidateId) {
  return candidateAnalyzer.analyze(candidateId);
}
