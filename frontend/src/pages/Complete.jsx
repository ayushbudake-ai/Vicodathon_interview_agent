import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Logo from "../components/common/Logo";

export default function Complete() {
  return (
    <div className="app-dark center-page">
      <Logo />
      <div className="complete-orb"><div><Check size={32} /></div></div>
      <div className="complete-copy">
        <span className="eyebrow"><Sparkles size={14} /> Interview complete</span>
        <h1>Nice work. Your<br /><span>report is ready.</span></h1>
        <p>Your responses have been analyzed across technical depth, reasoning, system design and communication.</p>
        <Link to="/results" className="btn btn-primary">View interview report <ArrowRight size={17} /></Link>
      </div>
      <span className="complete-footer">AI Cohort · Adaptive Technical Interview</span>
    </div>
  );
}
