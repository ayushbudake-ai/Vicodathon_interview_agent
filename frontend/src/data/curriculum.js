import officialCurriculum from "../../../data/curriculum.json";

const details = {
  1: { module: "Foundations", objectives: ["Configure an AI development environment", "Explain local tooling choices"], tools: ["Python", "VS Code"] },
  7: { module: "Embeddings", objectives: ["Explain vector representations", "Compare similarity strategies"], tools: ["Embeddings", "NumPy"] },
  8: { module: "Retrieval", objectives: ["Select vector-store capabilities", "Use metadata filtering"], tools: ["Chroma", "Pinecone"] },
  10: { module: "RAG", objectives: ["Design a retrieval pipeline", "Evaluate retrieval quality"], tools: ["RAG", "Hybrid search"] },
  12: { module: "Prompting", objectives: ["Write grounded system prompts", "Evaluate prompt changes"], tools: ["LLM APIs", "Prompt tests"] },
  16: { module: "Production AI", objectives: ["Design conversational state", "Define resilient API boundaries"], tools: ["REST APIs", "Redis"] },
  21: { module: "Agents", objectives: ["Design tool-using workflows", "Handle tool failures"], tools: ["LangChain", "MCP"] },
  28: { module: "Operations", objectives: ["Plan production deployment", "Monitor AI services"], tools: ["Docker", "Kubernetes"] }
};

export const curriculum = officialCurriculum.map((entry) => ({
  ...entry,
  ...(details[entry.day] || { module: entry.title, objectives: [], tools: [] }),
  topic: entry.topics,
  description: `${entry.title}: ${entry.topics}`
}));

export const getCurriculumDay = (day) => curriculum.find((item) => item.day === day) || null;
