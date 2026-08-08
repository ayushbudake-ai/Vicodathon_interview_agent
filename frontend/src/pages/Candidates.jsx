import { useNavigate } from "react-router-dom";
import { ChevronRight, GraduationCap, Gauge, Sparkles } from "lucide-react";
import Logo from "../components/common/Logo";
import { candidates } from "../data";

export default function Candidates() {
  const nav = useNavigate();
  const select = (candidate) => {
    if (!candidate.interviewEligible) return;
    localStorage.setItem("selectedCandidateId", candidate.id);
    nav(`/candidate/${candidate.id}`);
  };
  return (
    <div className="app-dark">
      <header className="navbar">
        <Logo />
        <span className="setup-label">CANDIDATE SELECT / 02</span>
      </header>
      <main className="section-container" style={{padding:"70px 0"}}>
        <div className="eyebrow"><Sparkles size={14}/> Personalized interview</div>
        <h1 style={{fontSize:"clamp(42px,6vw,68px)", margin:"16px 0"}}>Choose a learning journey.</h1>
        <p style={{color:"var(--muted)", maxWidth:650, lineHeight:1.7}}>
          Every session uses the supplied synthetic cohort profile to tailor topic coverage,
          difficulty and follow-up direction.
        </p>
        <div className="candidate-grid">
          {candidates.map((c, i) => (
            <button
              data-testid={`candidate-${c.id}`}
              className={`candidate-card ${c.interviewEligible ? "" : "candidate-card-disabled"}`}
              key={c.id}
              onClick={() => select(c)}
              disabled={!c.interviewEligible}
              title={c.interviewEligible ? undefined : `Only ${c.eligibleDayCount} eligible curriculum day(s) completed — at least 4 are needed to run an interview.`}
            >
              <div className="candidate-top">
                <div className="candidate-avatar">{c.initials}</div>
                <div style={{textAlign:"left"}}>
                  <strong>{c.name}</strong>
                  <span>{c.role}</span>
                </div>
                <ChevronRight size={18}/>
              </div>
              {!c.interviewEligible && (
                <div className="candidate-ineligible-note">
                  Not enough eligible curriculum coverage ({c.eligibleDayCount}/4 days) to run an interview.
                </div>
              )}
              <div className="candidate-divider"/>
              <div className="candidate-progress"><span>31-DAY COHORT</span><b>{c.cohort}%</b></div>
              <div className="progress"><span style={{width:`${c.cohort}%`}}/></div>
              <p>{c.bio}</p>
              <p><b>Strength:</b> {c.strengths.join(" · ") || "Consistent practice"}</p>
              <div className="candidate-stats">
                <div><small>MODULES</small><b>{c.modules}/31</b></div>
                <div><small>STREAK</small><b>{c.streak}d</b></div>
                <div><small>FOCUS</small><b>{c.weak[0]}</b></div>
                <div><small>READINESS</small><b>{c.readiness}%</b></div>
              </div>
            </button>
          ))}
        </div>
        <div className="candidate-summary">
          <div><GraduationCap/><b>31</b><span>curriculum days</span></div>
          <div><Sparkles/><b>08</b><span>required core questions</span></div>
          <div><Gauge/><b>4+</b><span>readiness dimensions</span></div>
        </div>
      </main>
    </div>
  );
}
