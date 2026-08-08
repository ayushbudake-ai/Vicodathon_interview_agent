import candidatesFile from "../../../data/candidates.json";
import officialCurriculum from "../../../data/curriculum.json";

// Mirrors the backend's eligibility rule exactly: a day only counts if it is both
// documented in curriculum.json AND completed (passed and not skipped).
const documentedDays = new Set(officialCurriculum.map((entry) => entry.day));
const MIN_ELIGIBLE_DAYS = 4;

export const candidateProfiles = candidatesFile.candidates.map((item) => {
  const member = item.member;
  const completed = item.missions.filter((mission) => mission.passed);
  const skipped = item.missions.filter((mission) => mission.skipped || mission.passed === false);
  const weakAreas = item.missions.filter((mission) => (mission.attempts || 0) >= 4 || mission.skipped || mission.passed === false);
  const strengths = completed.filter((mission) => (mission.attempts || 0) <= 2);
  const attempts = item.missions.reduce((total, mission) => total + (mission.attempts || 0), 0);
  const completedCount = completed.length;
  const eligibleDays = [...new Set(completed.map((mission) => mission.day).filter((day) => documentedDays.has(day)))];
  return {
    id: member.id.toLowerCase(), originalId: member.id, name: member.name, role: member.jobRole,
    education: member.education, experience: member.yearsExperience, status: member.status,
    initials: member.name.split(" ").map((name) => name[0]).join("").slice(0, 2),
    completedDays: completed.map((mission) => mission.day),
    completedTopics: completed.map((mission) => ({ day: mission.day, title: mission.title })),
    skippedTopics: skipped.map((mission) => ({ day: mission.day, title: mission.title })),
    attempts, learningSignals: item.signals,
    strengths: strengths.map((mission) => mission.title).slice(0, 2),
    weakAreas: weakAreas.map((mission) => mission.title).slice(0, 2),
    cohort: Math.round((completedCount / 31) * 100), modules: completedCount, streak: item.signals.commitDays,
    readiness: Math.min(96, Math.max(38, Math.round((completedCount / 10) * 62 + item.signals.missionsFirstTry))),
    weak: weakAreas.map((mission) => mission.title).slice(0, 2),
    bio: `${completedCount} completed missions, ${skipped.length} skipped, ${attempts} total attempts.`,
    eligibleDayCount: eligibleDays.length,
    interviewEligible: eligibleDays.length >= MIN_ELIGIBLE_DAYS
  };
});

export const getCandidateProfile = (id) => candidateProfiles.find((candidate) => candidate.id === id) || null;
