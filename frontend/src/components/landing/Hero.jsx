import { ArrowRight, CircleCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero section-container">
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={14} /> Adaptive AI technical interviews</div>
        <h1>Turn your cohort journey into a <span>real interview.</span></h1>
        <p>
          Practice with an AI interviewer that understands what you learned,
          asks intelligent follow-ups, and gives you actionable technical feedback.
        </p>
        <div className="hero-actions">
          <Link data-testid="start-interview" to="/candidates" className="btn btn-primary">Start your interview <ArrowRight size={17} /></Link>
          <a href="#how-it-works" className="text-link">See how it works <span>↓</span></a>
        </div>
        <div className="hero-proof">
          <span><CircleCheck size={16} /> Personalized to your cohort</span>
          <span><CircleCheck size={16} /> 8+ adaptive questions</span>
        </div>
      </div>

      <div className="hero-visual">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="interviewer-card">
          <div className="interviewer-top">
            <div className="avatar-glow"><Sparkles size={20} /></div>
            <div>
              <strong>AI Interviewer</strong>
              <span><i className="live-dot" /> Interview in progress</span>
            </div>
            <span className="tiny-counter">05 / 12</span>
          </div>
          <div className="question-bubble">
            <span className="bubble-label">RAG · FOLLOW-UP</span>
            <p>How would you distinguish a retrieval problem from a generation problem in production?</p>
          </div>
          <div className="mini-answer">
            <span>YOU</span>
            <p>I'd inspect retrieval relevance first, then evaluate the generated answer against the retrieved context.</p>
          </div>
          <div className="mini-progress"><span style={{ width: "58%" }} /></div>
        </div>
      </div>
    </section>
  );
}
