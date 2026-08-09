import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Clock3, Sparkles, Target, RefreshCw, Layers, ShieldCheck, Compass } from "lucide-react";
import Logo from "../components/common/Logo";
import Button from "../components/common/Button";
import { candidates } from "../data";
import { startInterviewSession } from "../services/interviewService";
import DomainSelector from "../components/setup/DomainSelector";
import DifficultySelector from "../components/setup/DifficultySelector";

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

  const [setupStep, setSetupStep] = useState(1); // 1: Domain, 2: Difficulty, 3: Review
  const [selectedDomain, setSelectedDomain] = useState(localStorage.getItem("selectedDomain") || "Backend Development");
  const [selectedDifficulty, setSelectedDifficulty] = useState(localStorage.getItem("selectedDifficulty") || "Advanced");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const handleSelectDomain = (domainId) => {
    setSelectedDomain(domainId);
    localStorage.setItem("selectedDomain", domainId);
  };

  const handleSelectDifficulty = (difficultyId) => {
    setSelectedDifficulty(difficultyId);
    localStorage.setItem("selectedDifficulty", difficultyId);
  };

  const handleStartInterview = async () => {
    setIsStarting(true);
    setStartError("");
    try {
      localStorage.setItem("selectedCandidateId", selectedCandidate.id);
      localStorage.setItem("selectedDomain", selectedDomain);
      localStorage.setItem("selectedDifficulty", selectedDifficulty);

      const res = await startInterviewSession(
        selectedCandidate.originalId || selectedCandidate.id,
        selectedDomain,
        selectedDifficulty
      );
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
    { name: "Technical Knowledge", desc: "Core concepts, architecture principles & domain accuracy" },
    { name: "Problem Solving", desc: "Structured approach, edge cases & analytical reasoning" },
    { name: "System Design", desc: "Scalability, data flow & modular system design" },
    { name: "Production Thinking", desc: "Reliability, security, monitoring & real-world trade-offs" },
    { name: "Communication", desc: "Clear explanations, logical structure & trade-off rationale" },
    { name: "Practical Experience", desc: "Hands-on implementation depth & quantitative evidence" }
  ];

  return (
    <div className="app-dark">
      <div className="setup-shell">
        <header className="setup-header">
          <Link to="/"><Logo /></Link>
          <span className="setup-label">INTERVIEW SETUP / STEP 0{setupStep} OF 03</span>
        </header>

        <section className="setup-content">
          <div className="setup-intro">
            <div className="eyebrow"><Sparkles size={14} /> Adaptive AI Technical Interview</div>
            <h1>Configure your<br /><span>Interview Parameters.</span></h1>
            <p>Target domain, difficulty level, and rubric expectations for candidate <strong>{selectedCandidate.name}</strong> ({selectedCandidate.role}).</p>
          </div>

          {/* Stepper Navigation Bar */}
          <div className="setup-stepper">
            <button
              type="button"
              className={`stepper-tab ${setupStep === 1 ? "active" : setupStep > 1 ? "completed" : ""}`}
              onClick={() => setSetupStep(1)}
            >
              <span className="step-num">01</span>
              <span>1. Select Domain ({selectedDomain})</span>
            </button>
            <button
              type="button"
              className={`stepper-tab ${setupStep === 2 ? "active" : setupStep > 2 ? "completed" : ""}`}
              onClick={() => setSetupStep(2)}
            >
              <span className="step-num">02</span>
              <span>2. Select Difficulty ({selectedDifficulty})</span>
            </button>
            <button
              type="button"
              className={`stepper-tab ${setupStep === 3 ? "active" : ""}`}
              onClick={() => setSetupStep(3)}
            >
              <span className="step-num">03</span>
              <span>3. Review & Start</span>
            </button>
          </div>

          {startError && (
            <div className="session-note" role="alert" style={{ borderColor: "#ff9d9d", marginBottom: 20 }}>
              <span>⚠</span>
              <p>{startError}</p>
            </div>
          )}

          {/* Step 1: Domain Selection */}
          {setupStep === 1 && (
            <div className="setup-step-view">
              <DomainSelector
                selectedDomain={selectedDomain}
                onSelectDomain={handleSelectDomain}
              />
              <div className="step-actions">
                <button type="button" className="text-link" onClick={() => navigate(`/candidate/${selectedCandidate.id}`)}>
                  ← Back to candidate profile
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setSetupStep(2)}>
                  Continue to Difficulty <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Difficulty Selection */}
          {setupStep === 2 && (
            <div className="setup-step-view">
              <DifficultySelector
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={handleSelectDifficulty}
              />
              <div className="step-actions">
                <button type="button" className="text-link" onClick={() => setSetupStep(1)}>
                  ← Change Domain
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setSetupStep(3)}>
                  Review Configuration <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Start */}
          {setupStep === 3 && (
            <div className="setup-grid">
              <div className="setup-card journey-card">
                <div className="card-header">
                  <div>
                    <span className="small-label">6-DIMENSION EVALUATION RUBRIC</span>
                    <h2>You Will Be Evaluated On</h2>
                  </div>
                  <span className="completion-pill">Strict & Fair</span>
                </div>

                <div className="journey-list">
                  {assessedAreas.map((area) => (
                    <div className="journey-row" key={area.name}>
                      <span className="journey-check checked"><Check size={14} /></span>
                      <div>
                        <strong>{area.name}</strong>
                        <span>{area.desc}</span>
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
                <span className="small-label">SESSION SUMMARY</span>
                <h2>Interview Configuration</h2>

                <div className="config-summary-box">
                  <div className="config-summary-row">
                    <Compass size={16} />
                    <div>
                      <small>CANDIDATE</small>
                      <strong>{selectedCandidate.name}</strong>
                    </div>
                  </div>
                  <div className="config-summary-row">
                    <Layers size={16} />
                    <div>
                      <small>TECHNICAL DOMAIN</small>
                      <strong>{selectedDomain}</strong>
                    </div>
                    <button type="button" className="config-edit-link" onClick={() => setSetupStep(1)}>Change</button>
                  </div>
                  <div className="config-summary-row">
                    <ShieldCheck size={16} />
                    <div>
                      <small>DIFFICULTY LEVEL</small>
                      <strong>{selectedDifficulty}</strong>
                    </div>
                    <button type="button" className="config-edit-link" onClick={() => setSetupStep(2)}>Change</button>
                  </div>
                </div>

                <div className="session-meta">
                  <div><Clock3 size={17} /><span><strong>15–20 min</strong> Estimated duration</span></div>
                  <div><Target size={17} /><span><strong>8+ Core</strong> Adaptive questions</span></div>
                </div>

                <div className="session-note">
                  <span>✦</span>
                  <p>Questions are dynamically generated by OpenAI using the selected domain, difficulty, candidate curriculum, and real-time answer signals.</p>
                </div>

                {/* Section 10: Start Interview button with single arrow */}
                <Button testId="begin-interview" onClick={handleStartInterview} disabled={isStarting}>
                  {isStarting ? "Initializing AI Engine..." : "Start Interview →"}
                </Button>

                <button className="back-button" onClick={() => navigate("/candidates")} style={{ marginTop: 12 }}>
                  ← Choose a different candidate
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
