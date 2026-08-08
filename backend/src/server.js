import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import interviewRouter from "./routes/interview.js";

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env");
if (process.env.NODE_ENV !== "production" && fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(envPath);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ai-interview-agent-backend" });
});

app.use("/api/interview", interviewRouter);

export { app };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}
