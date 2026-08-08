import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles, Target, RefreshCw } from "lucide-react";
import Logo from "../components/common/Logo";
import Button from "../components/common/Button";
import { candidates } from "../data";
import { startInterviewSession } from "../services/interviewService";

const fallbackQuotes = [
  "Your best answer is the one that makes your reasoning visible.",
  "Explain the trade-off, not just the choice — that is what separates senior thinking.",
  "Precision beats confidence. Say exactly what you know, and exactly where you are unsure.",
  "Depth over breadth: one well-reasoned trade-off beats five surface-level facts.",
  "The best candidates narrate their assumptions instead of hiding them."
];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { candidateId: urlCandidateId } = useParams();
  const selectedId = urlCandidateId || localStorage.getItem("selectedCandidateId");
  const selectedCandidate = candidates.find(c => c.id.toLowerCase() === (selectedId || "").toLowerCase()) || candidates[0];

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const handleStartInterview = async () => {
    setIsStarting(true);
    setStartError("");
    try {
      localStorage.setItem("selectedCandidateId", selectedCandidate.id);
      const res = await startInterviewSession(selectedCandidate.originalId || selectedCandidate.id);
      if (res && res.sessionId) {
        localStorage.setItem("activeSessionId", res.sessionId);
        navigate(`/interview/session/${res.sessionId}`);
      } else {
        navigate("/interview");
      }
    } catch (err) {
      setStartError(err.message || "Failed to start interview session. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const assessedAreas = [
    "Technical Knowledge & Fundamentals",
    "Problem Solving & Analytical Reasoning",
    "System Design & Scalability",
    "Production Thinking & Observability",
    "Communication & Clear Rationale"
  ];

  return (
    <div className="app-dark">
      <div className="setup-shell">
        <header className="setup-header">
          <Link to="/"><Logo /></Link>
          <span className="setup-label">INTERVIEW SETUP</span>
        </header>

        <section className="setup-content">
          <div className="setup-intro">
            <div className="eyebrow"><Sparkles size={14} /> Adaptive AI Assessment</div>
            <h1>Prepare for your<br /><span>Technical Interview.</span></h1>
            <p>The interviewer will adapt questions dynamically based on your experience, claimed projects, and reasoning.</p>
            <p style={{ marginTop: 10 }}><strong>Candidate:</strong> {selectedCandidate.name} · {selectedCandidate.role}</p>
          </div>

          {startError && (
            <div className="session-note" role="alert" style={{ borderColor: "#ff9d9d", marginBottom: 20 }}>
              <span>⚠</span>
              <p>{startError}</p>
            </div>
          )}

          <div className="setup-grid">
            <div className="setup-card journey-card">
              <div className="card-header">
                <div>
                  <span className="small-label">EVALUATION FRAMEWORK</span>
                  <h2>Assessed Competencies</h2>
                </div>
                <span className="completion-pill">Adaptive Depth</span>
              </div>

              <div className="journey-list">
                {assessedAreas.map((area) => (
                  <div className="journey-row" key={area}>
                    <span className="journey-check checked"><Check size={14} /></span>
                    <div>
                      <strong>{area}</strong>
                      <span>Independent evaluation metric</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Integrated Mindset Quote Card */}
              <div className="quote-card" style={{ marginTop: 24, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span className="small-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={13} /> INTERVIEW MINDSET
                  </span>
                  <button
                    onClick={() => setQuoteIndex((prev) => (prev + 1) % fallbackQuotes.length)}
                    style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}
                  >
                    <RefreshCw size={12} /> Cycle
                  </button>
                </div>
                <blockquote style={{ fontSize: "0.95rem", fontStyle: "italic", margin: 0, color: "#e0e0e0" }}>
                  “{fallbackQuotes[quoteIndex]}”
                </blockquote>
              </div>
            </div>

            <div className="setup-card session-card">
              <span className="small-label">SESSION DETAILS</span>
              <h2>Adaptive Technical Interview</h2>
              <p>The session starts with a brief warm-up, followed by project exploration, technical depth, and system design scenarios.</p>

              <div className="session-meta">
                <div><Clock3 size={17} /><span><strong>15–20 min</strong> Estimated duration</span></div>
                <div><Target size={17} /><span><strong>8–11</strong> Adaptive questions</span></div>
              </div>

              <div className="session-note">
                <span>✦</span>
                <p>Your evaluation is grounded in how clearly you reason out loud and evaluate trade-offs — not just simple correctness.</p>
              </div>

              <Button testId="begin-interview" onClick={handleStartInterview} disabled={isStarting}>
                {isStarting ? "Initializing Session..." : "Start Interview"} <ArrowRight size={17} />
              </Button>

              <button className="back-button" onClick={() => navigate("/candidates")} style={{ marginTop: 12 }}>
                ← Choose a different candidate
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

