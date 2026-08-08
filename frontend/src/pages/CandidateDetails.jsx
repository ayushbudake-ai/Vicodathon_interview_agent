import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";
import Logo from "../components/common/Logo";
import { candidates } from "../data";

export default function CandidateDetails() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const candidate = candidates.find((item) => item.id === candidateId) || candidates[0];

  const continueToSetup = () => {
    localStorage.setItem("selectedCandidateId", candidate.id);
    navigate(`/interview/${candidate.id}`);
  };

  return (
    <div className="app-dark">
      <div className="setup-shell">
        <header className="setup-header">
          <Link to="/candidates"><Logo /></Link>
          <span className="setup-label">CANDIDATE PROFILE / 03</span>
        </header>

        <main className="candidate-details-page">
          <Link to="/candidates" className="text-link"><ArrowLeft size={15} /> Back to candidates</Link>
          <div className="detail-hero">
            <div className="candidate-avatar detail-avatar">{candidate.initials}</div>
            <div>
              <div className="eyebrow"><Sparkles size={14} /> Personalized interview profile</div>
              <h1>{candidate.name}</h1>
              <p>{candidate.role} · {candidate.experience} years experience</p>
            </div>
          </div>

          <div className="detail-grid">
            <section className="setup-card">
              <span className="small-label">LEARNING SIGNALS</span>
              <h2>Readiness overview</h2>
              <div className="detail-stat-grid">
                <div><strong>{candidate.readiness}%</strong><span>Readiness</span></div>
                <div><strong>{candidate.modules}/31</strong><span>Completed modules</span></div>
                <div><strong>{candidate.streak}d</strong><span>Practice streak</span></div>
                <div><strong>{candidate.attempts}</strong><span>Total attempts</span></div>
              </div>
            </section>

            <section className="setup-card">
              <span className="small-label">PERSONALIZATION</span>
              <h2>What the interviewer will use</h2>
              <ul className="detail-list">
                <li><CheckCircle2 size={16} /> Completed curriculum topics</li>
                <li><CheckCircle2 size={16} /> Weak and strong learning signals</li>
                <li><CheckCircle2 size={16} /> Previous answers during this session</li>
                <li><CheckCircle2 size={16} /> Adaptive difficulty and follow-ups</li>
              </ul>
            </section>
          </div>

          <section className="setup-card topic-preview">
            <div className="card-header">
              <div><span className="small-label">ELIGIBLE TOPICS</span><h2>Topics available for this interview</h2></div>
              <GraduationCap size={20} />
            </div>
            <div className="topic-chip-grid">
              {candidate.completedTopics.slice(0, 12).map((topic) => (
                <span key={`${topic.day}-${topic.title}`}>Day {topic.day} · {topic.title}</span>
              ))}
            </div>
          </section>

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={continueToSetup}>Continue to interview setup <ArrowRight size={17} /></button>
          </div>
        </main>
      </div>
    </div>
  );
}
