import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles, Target, RefreshCw, Layers, Briefcase, Award } from "lucide-react";
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

const DOMAINS = [
  "AI / Machine Learning",
  "Web Development",
  "Backend Development",
  "Full Stack Development",
  "Data Science",
  "Data Engineering",
  "Cybersecurity",
  "DevOps / Cloud",
  "Software Engineering"
];

const ROLES = [
  "AI Engineer",
  "ML Engineer",
  "Data Scientist",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Data Engineer",
  "DevOps Engineer",
  "MLOps Engineer",
  "Software Engineer"
];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const { candidateId: urlCandidateId } = useParams();
  const selectedId = urlCandidateId || localStorage.getItem("selectedCandidateId");
  const selectedCandidate = candidates.find(c => c.id.toLowerCase() === (selectedId || "").toLowerCase()) || candidates[0];

  const [domain, setDomain] = useState(localStorage.getItem("selectedDomain") || "AI / Machine Learning");
  const [role, setRole] = useState(localStorage.getItem("selectedRole") || selectedCandidate.role || "AI Engineer");
  const [experienceLevel, setExperienceLevel] = useState(localStorage.getItem("selectedExperienceLevel") || "Intermediate");

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const handleStartInterview = async () => {
    setIsStarting(true);
    setStartError("");
    try {
      localStorage.setItem("selectedCandidateId", selectedCandidate.id);
      localStorage.setItem("selectedDomain", domain);
      localStorage.setItem("selectedRole", role);
      localStorage.setItem("selectedExperienceLevel", experienceLevel);

      const res = await startInterviewSession({
        candidateId: selectedCandidate.originalId || selectedCandidate.id,
        domain,
        role,
        experienceLevel
      });

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
    "Technical Knowledge & Domain Depth",
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
            <div className="eyebrow"><Sparkles size={14} /> Domain-Aware Adaptive AI Assessment</div>
            <h1>Prepare for your<br /><span>Technical Interview.</span></h1>
            <p>Customize your target domain, role, and experience level. Questions and curriculum coverage will adapt dynamically.</p>
            <p style={{ marginTop: 10 }}><strong>Candidate:</strong> {selectedCandidate.name} ({selectedCandidate.id})</p>
          </div>

          {startError && (
            <div className="session-note" role="alert" style={{ borderColor: "#ff9d9d", marginBottom: 20 }}>
              <span>⚠</span>
              <p>{startError}</p>
            </div>
          )}

          {/* Domain, Role, Experience Selection Form */}
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "20px 24px", marginBottom: 24 }}>
            <h3 style={{ fontSize: "1rem", color: "#f0f6fc", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} color="#58a6ff" /> Target Interview Profile
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "#8b949e", marginBottom: 6 }}>
                  <Layers size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: "0.9rem" }}
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "#8b949e", marginBottom: 6 }}>
                  <Briefcase size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Target Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: "0.9rem" }}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "#8b949e", marginBottom: 6 }}>
                  <Award size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#f0f6fc", fontSize: "0.9rem" }}
                >
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
              <h2>{domain} Interview</h2>
              <p>Tailored for <strong>{role}</strong> ({experienceLevel} level). Enforces minimum 8 questions spanning at least 4 curriculum days.</p>

              <div className="session-meta">
                <div><Clock3 size={17} /><span><strong>15–20 min</strong> Estimated duration</span></div>
                <div><Target size={17} /><span><strong>8+</strong> Mandatory questions</span></div>
              </div>

              <div className="session-note">
                <span>✦</span>
                <p>Your evaluation is grounded in how clearly you reason out loud and evaluate trade-offs — not just simple answer length.</p>
              </div>

              <Button testId="begin-interview" onClick={handleStartInterview} disabled={isStarting}>
                {isStarting ? "Initializing Session..." : `Start ${role} Interview`} <ArrowRight size={17} />
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
