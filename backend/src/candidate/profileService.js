import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data");
const candidatesFile = JSON.parse(fs.readFileSync(path.join(dataDir, "candidates.json"), "utf8"));

export function getCandidateProfile(candidateId) {
  return candidatesFile.candidates.find((candidate) => candidate.member.id.toLowerCase() === String(candidateId).toLowerCase()) || null;
}

