import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock3, Sparkles } from "lucide-react";
import Logo from "../components/common/Logo";
import Button from "../components/common/Button";
import { candidates } from "../data";

export default function InterviewSetup() {
  const navigate = useNavigate();
  const selectedId = localStorage.getItem("selectedCandidateId");
  const selectedCandidate = candidates.find(c => c.id === selectedId) || candidates[0];
  const topics = selectedCandidate.completedTopics.slice(0, 6).map((topic) => [topic.title, `Day ${topic.day} · eligible`, true]);

  return (
    <div className="app-dark">
      <div className="setup-shell">
        <header className="setup-header">
          <Link to="/"><Logo /></Link>
          <span className="setup-label">INTERVIEW SETUP / 04</span>
        </header>

        <section className="setup-content">
          <div className="setup-intro">
            <div className="eyebrow"><Sparkles size={14} /> Personalized session</div>
            <h1>Let's prepare your<br /><span>technical interview.</span></h1>
            <p>The interview will adapt to your cohort progress, answers and learning signals.</p><p style={{marginTop:10}}><strong>{selectedCandidate.name}</strong> · {selectedCandidate.role}</p>
          </div>

          <div className="setup-grid">
            <div className="setup-card journey-card">
              <div className="card-header">
                <div>
                  <span className="small-label">YOUR LEARNING JOURNEY</span>
                  <h2>AI Engineering Cohort</h2>
                </div>
                <span className="completion-pill">{selectedCandidate.readiness}% ready</span>
              </div>

              <div className="journey-list">
                {topics.map(([name, status, complete]) => (
                  <div className="journey-row" key={name}>
                    <span className={`journey-check ${complete ? "checked" : ""}`}>{complete && <Check size={14} />}</span>
                    <div>
                      <strong>{name}</strong>
                      <span>{status}</span>
                    </div>
                    <span className="row-arrow">→</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="setup-card session-card">
              <span className="small-label">YOUR SESSION</span>
              <h2>Adaptive technical interview</h2>
              <p>We'll start broad, then go deeper based on how you reason through each problem.</p>

              <div className="session-meta">
                <div><Clock3 size={17} /><span><strong>15–20 min</strong> Estimated time</span></div>
                <div><Sparkles size={17} /><span><strong>8–12</strong> Adaptive questions</span></div>
              </div>

              <div className="session-note">
                <span>✦</span>
                <p>Your score is based on technical depth, reasoning, system design and communication — not just correctness.</p>
              </div>

              {selectedCandidate.interviewEligible ? (
                <Button testId="begin-interview" onClick={() => navigate("/quote")}>Start interview</Button>
              ) : (
                <div className="session-note" role="alert" style={{ borderColor: "#ff9d9d" }}>
                  <span>⚠</span>
                  <p>
                    {selectedCandidate.name} has only {selectedCandidate.eligibleDayCount} eligible curriculum day(s)
                    completed — at least 4 are needed to run a full interview. Choose a different candidate.
                  </p>
                </div>
              )}
              <button className="back-button" onClick={() => navigate("/candidates")}>← Choose a different candidate</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
