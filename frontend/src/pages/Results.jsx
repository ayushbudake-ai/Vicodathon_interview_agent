import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Sparkles, Target } from "lucide-react";
import Logo from "../components/common/Logo";
import { useInterview } from "../context/InterviewContext";

export default function Results() {
  const { results, sessionState, candidate, feedbackStatus } = useInterview();
  if (!results) return <div className="app-dark center-page"><div className="complete-copy"><span className="eyebrow">Feedback status</span><h1>Preparing your<br /><span>interview report.</span></h1><p>{feedbackStatus === "loading" ? "Your live AI evaluation is still running." : "Complete an interview to generate a report."}</p></div></div>;

  return (
    <div className="app-dark results-app">
      <header className="results-header">
        <Link to="/"><Logo /></Link>
        <span className="setup-label">INTERVIEW REPORT</span>
        <Link to="/setup" className="new-interview">New interview <ArrowRight size={15} /></Link>
      </header>

      <main className="results-main">
        <div className="results-intro">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> Your technical assessment</div>
            <h1>Strong foundation.<br /><span>Clear next steps.</span></h1>
          </div>
          <p>Based on your adaptive interview across the AI Cohort curriculum.</p>
        </div>

        <section className="score-hero">
          <div className="score-ring"><div><strong>{results.overall}</strong><span>/ 100</span></div></div>
          <div className="score-copy">
            <span className="small-label">OVERALL PERFORMANCE</span>
            <h2 data-testid="feedback-summary">{results.overall >= 75 ? "Strong performance" : results.overall >= 55 ? "Solid progress" : "Clear next steps"}</h2>
            <p>{results.recommendation || "Your responses have been evaluated across the interview curriculum."}</p>
          </div>
          <div className="score-stat"><strong>{results.topicScores.length}</strong><span>topics explored</span></div>
          <div className="score-stat"><strong>{sessionState.answers.length}</strong><span>questions answered</span></div>
        </section>

        <section className="report-grid">
          <article className="report-card">
            <div className="card-header">
              <div><span className="small-label">SKILL BREAKDOWN</span><h2>How you performed</h2></div>
            </div>
            {[
              ["Technical knowledge", results.technical],
              ["System design", results.systemDesign],
              ["Problem solving", results.problemSolving],
              ["Communication", results.communication],
              ["Production thinking", results.production]
            ].map(([name, score]) => (
              <div className="skill-row" key={name}>
                <div><span>{name}</span><strong>{score}</strong></div>
                <div className="skill-track"><i style={{ width: `${score}%` }} /></div>
              </div>
            ))}
          </article>

          <article className="report-card">
            <div className="card-header">
              <div><span className="small-label">TOPIC PERFORMANCE</span><h2>Your cohort map</h2></div>
            </div>
            <div className="topic-score-list">
              {results.topicScores.map(([topic, score]) => (
                <div className="topic-score" key={topic}>
                  <span>{topic}</span>
                  <div className="skill-track"><i style={{ width: `${score}%` }} /></div>
                  <strong>{score}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="insights-grid">
          <article className="insight-card positive">
            <div className="insight-icon"><CheckCircle2 size={19} /></div>
            <div><span className="small-label">YOUR STRENGTHS</span><h2>What stood out</h2></div>
            <ul>{results.strengths.map((item) => <li key={item}><strong>{item}</strong></li>)}</ul>
          </article>

          <article className="insight-card improvement">
            <div className="insight-icon"><CircleAlert size={19} /></div>
            <div><span className="small-label">ROOM TO GROW</span><h2>What to strengthen</h2></div>
            <ul>{results.weaknesses.map((item) => <li key={item}><strong>{item}</strong></li>)}</ul>
          </article>
        </section>

        <section className="learning-plan">
          <div>
            <div className="eyebrow"><Target size={14} /> Recommended next steps</div>
            <h2>Your focused learning plan.</h2>
            <p>Three areas that will give you the highest interview payoff next.</p>
          </div>
          <div className="plan-list">
            {results.topicsToRevise.slice(0, 3).map((title, index) => (
              <div className="plan-row" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{results.recommendation || "Review this area using your interview feedback."}</p></div><ArrowRight size={16} />
              </div>
            ))}
          </div>
        </section>

        <section className="report-card" style={{ marginTop: 18 }}>
          <div className="card-header"><div><span className="small-label">INTERVIEW TRACE</span><h2>Question-by-question performance</h2></div><span className="completion-pill">{sessionState.answers.length} responses</span></div>
          <div className="topic-score-list">
            {sessionState.answers.map((answer, index) => (
              <div className="topic-score" key={answer.questionId}>
                <span>Q{index + 1} · {sessionState.questionsAsked.find((question) => question.id === answer.questionId)?.topic || "Technical reasoning"}</span>
                <div className="skill-track"><i style={{ width: answer.quality === "strong" ? "84%" : answer.quality === "ai-evaluated" ? "72%" : "62%" }} /></div>
                <strong>{answer.quality === "strong" ? "Strong" : answer.quality === "ai-evaluated" ? "Evaluated" : "Clarify"}</strong>
              </div>
            ))}
          </div>
          <p style={{color:"var(--muted)", fontSize:12, lineHeight:1.6, marginBottom:0}}><strong>{candidate.name}:</strong> {results.recommendation}</p>
        </section>

        <Link to="/setup" className="results-back"><ArrowLeft size={15} /> Practice another interview</Link>
      </main>
    </div>
  );
}
