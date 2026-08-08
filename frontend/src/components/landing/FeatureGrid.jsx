import { BrainCircuit, GitBranch, Gauge, MessageSquareText } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "Personalized questions",
    text: "Your completed missions and learning signals shape every interview."
  },
  {
    icon: GitBranch,
    title: "Adaptive follow-ups",
    text: "Strong answers go deeper. Weak spots become intelligent follow-up questions."
  },
  {
    icon: Gauge,
    title: "Technical evaluation",
    text: "Measure technical depth, system design, problem solving and communication."
  },
  {
    icon: MessageSquareText,
    title: "Actionable feedback",
    text: "Leave with clear strengths, gaps and a practical next-step learning plan."
  }
];

export default function FeatureGrid() {
  return (
    <section id="features" className="section-container section-block">
      <div className="section-heading">
        <div>
          <div className="eyebrow">Built around your learning journey</div>
          <h2>Powerful features,<br /><span>just for you.</span></h2>
        </div>
        <p>Everything you need to turn 31 days of learning into interview-ready engineering confidence.</p>
      </div>

      <div className="feature-grid">
        {features.map(({ icon: Icon, title, text }, index) => (
          <article className={`feature-card feature-${index + 1}`} key={title}>
            <div className="card-grid" />
            <div className="feature-icon"><Icon size={22} /></div>
            <div className="feature-copy">
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <span className="card-number">0{index + 1}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
