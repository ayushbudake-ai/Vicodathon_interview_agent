import fs from "node:fs";
import path from "node:path";

const root = path.resolve("..");
const candidatesFile = JSON.parse(fs.readFileSync(path.join(root, "data", "candidates.json"), "utf8"));

export function getCandidateProfile(candidateId) {
  return candidatesFile.candidates.find((candidate) => candidate.member.id.toLowerCase() === String(candidateId).toLowerCase()) || null;
}
