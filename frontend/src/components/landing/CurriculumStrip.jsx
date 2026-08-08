const topics = ["RAG", "Vector Databases", "Prompt Engineering", "Agentic AI", "MCP", "AI Deployment", "Production AI"];

export default function CurriculumStrip() {
  return (
    <section id="topics" className="curriculum-section">
      <div className="section-container">
        <div className="curriculum-head">
          <div>
            <div className="eyebrow">31-day AI cohort</div>
            <h2>Your curriculum. <span>Your interview.</span></h2>
          </div>
          <p>The agent can connect concepts across your learning journey instead of testing isolated definitions.</p>
        </div>
        <div className="topic-marquee">
          {topics.concat(topics).map((topic, i) => (
            <span key={`${topic}-${i}`}>{topic}<b>✦</b></span>
          ))}
        </div>
      </div>
    </section>
  );
}
