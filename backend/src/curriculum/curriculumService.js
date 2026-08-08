import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../data");

function loadCurriculum() {
  return JSON.parse(fs.readFileSync(path.join(dataDirectory, "curriculum.json"), "utf8"));
}

/** Provides read-only access to the curriculum's actual JSON schema. */
export class CurriculumService {
  constructor(curriculum = loadCurriculum()) {
    this.curriculum = Array.isArray(curriculum) ? curriculum : [];
  }

  getAllDays() {
    return this.curriculum;
  }

  getDay(day) {
    return this.curriculum.find((entry) => entry?.day === Number(day)) || null;
  }

  getTopicsForDay(day) {
    const entry = this.getDay(day);
    return entry?.topics ?? null;
  }

  getModuleForDay(day) {
    const entry = this.getDay(day);
    return entry?.title ?? null;
  }

  getLearningObjectiveForDay(_day) {
    // The current source curriculum does not provide a learning-objective field.
    return null;
  }

  getToolsForDay(_day) {
    // The current source curriculum does not provide a tools field.
    return [];
  }
}

export const curriculumService = new CurriculumService();

// Retained for the existing interview route.
export function getCurriculumTopics() {
  return curriculumService.getAllDays();
}
