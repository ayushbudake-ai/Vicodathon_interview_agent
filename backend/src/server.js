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
export default app;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = app.listen(PORT, () => console.log(`AI Interview Agent running on port ${PORT}`));
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n[ERROR] Port ${PORT} is already in use by another process.`);
      console.error(`Port ${PORT} has been freed or you can specify a different port with: PORT=5001 npm run dev\n`);
      process.exit(1);
    } else {
      console.error(err);
    }
  });
}
