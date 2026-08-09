import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Sparkles, Target, RefreshCw } from "lucide-react";
import Logo from "../components/common/Logo";
import { useInterview } from "../context/InterviewContext";

export default function Results() {
  const { sessionId } = useParams();
  const { results, sessionState, candidate, feedbackStatus, fetchFeedback } = useInterview();

  useEffect(() => {
    if (!results && sessionId && feedbackStatus !== "loading") {
      fetchFeedback(sessionId);
    }
  }, [results, sessionId, feedbackStatus, fetchFeedback]);

  if (!results) {
    return (
      <div className="app-dark center-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="complete-copy" style={{ textAlign: "center", padding: 32 }}>
          <span className="eyebrow"><Sparkles size={16} /> Generating AI Evaluation</span>
          <h1 style={{ marginTop: 12 }}>Analyzing your<br /><span style={{ color: "#38bdf8" }}>interview performance.</span></h1>
          <p style={{ color: "#a1a1aa", marginTop: 8 }}>
            {feedbackStatus === "loading"
              ? "Synthesizing answers, technical depth, and system design signals..."
              : "No active report found. Start an interview to see your detailed report."}
          </p>
          {feedbackStatus === "error" && (
            <button onClick={() => fetchFeedback(sessionId)} className="btn btn-primary" style={{ marginTop: 16 }}>
              <RefreshCw size={14} /> Retry Report Generation
            </button>
          )}
          <div style={{ marginTop: 24 }}>
            <Link to="/setup" className="new-interview">← Return to Interview Setup</Link>
          </div>
        </div>
      </div>
    );
  }

  const competencies = [
    ["Technical Knowledge", results.technical],
    ["Problem Solving", results.problemSolving],
    ["System Design", results.systemDesign],
    ["Production Thinking", results.production],
    ["Communication", results.communication],
    ["Practical Experience", results.practicalExperience]
  ];

  return (
    <div className="app-dark results-app">
      <header className="results-header">
        <Link to="/"><Logo /></Link>
        <span className="setup-label">COMPETENCY REPORT</span>
        <Link to="/setup" className="new-interview">New interview <ArrowRight size={15} /></Link>
      </header>

      <main className="results-main">
        <div className="results-intro">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> Comprehensive Evaluation</div>
            <h1>{results.role || "Technical"} Evaluation Report<br /><span>{results.domain || "AI / Machine Learning"}</span></h1>
          </div>
          <p>Evaluation profile: <strong>{results.role || "Role"}</strong> ({results.experienceLevel || "Level"} Level) · {results.domain || "Domain"}</p>
        </div>

        <section className="score-hero">
          <div className="score-ring">
            <div>
              <strong>{results.overall}</strong>
              <span>/ 100</span>
            </div>
          </div>
          <div className="score-copy">
            <span className="small-label">OVERALL COMPETENCY SCORE</span>
            <h2 data-testid="feedback-summary">
              {results.overall >= 80 ? "Exceptional Candidate" : results.overall >= 70 ? "Strong Technical Signal" : "Solid Progress"}
            </h2>
            <p>{results.summary || results.recommendation || "Your responses demonstrate clear technical reasoning across the interview topics."}</p>
          </div>
          <div className="score-stat">
            <strong>{results.curriculumCoverage?.count || results.curriculumCoverage?.daysCovered?.length || 0}</strong>
            <span>curriculum days covered</span>
          </div>
          <div className="score-stat">
            <strong>{results.questionsAsked || sessionState?.answers?.length || 0}</strong>
            <span>questions asked</span>
          </div>
          <div className="score-stat">
            <strong>{results.followUpsAsked || 0}</strong>
            <span>follow-ups asked</span>
          </div>
        </section>

        <section className="report-grid">
          <article className="report-card">
            <div className="card-header">
              <div>
                <span className="small-label">6-DIMENSION COMPETENCY MODEL</span>
                <h2>Independent Skill Breakdown</h2>
              </div>
            </div>
            {competencies.map(([name, score]) => (
              <div className="skill-row" key={name}>
                <div>
                  <span>{name}</span>
                  <strong>{score ?? 75}</strong>
                </div>
                <div className="skill-track">
                  <i style={{ width: `${score ?? 75}%` }} />
                </div>
              </div>
            ))}
          </article>

          <article className="report-card">
            <div className="card-header">
              <div>
                <span className="small-label">TOPIC BREAKDOWN</span>
                <h2>Explored Technical Areas</h2>
              </div>
            </div>
            <div className="topic-score-list">
              {(results.topicScores || []).map(([topic, score]) => (
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
            <div>
              <span className="small-label">KEY STRENGTHS</span>
              <h2>What Stood Out</h2>
            </div>
            <ul>
              {(results.strengths || []).map((item) => (
                <li key={item}><strong>{item}</strong></li>
              ))}
            </ul>
          </article>

          <article className="insight-card improvement">
            <div className="insight-icon"><CircleAlert size={19} /></div>
            <div>
              <span className="small-label">AREAS TO IMPROVE</span>
              <h2>What to Strengthen</h2>
            </div>
            <ul>
              {(results.weaknesses || []).map((item) => (
                <li key={item}><strong>{item}</strong></li>
              ))}
            </ul>
          </article>
        </section>

        <section className="learning-plan">
          <div>
            <div className="eyebrow"><Target size={14} /> Actionable Next Steps</div>
            <h2>Recommended Focus Areas</h2>
            <p>Targeted topics to elevate your technical interview performance.</p>
          </div>
          <div className="plan-list">
            {(results.topicsToRevise || []).slice(0, 3).map((title, index) => (
              <div className="plan-row" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{(results.recommendations || [])[index] || results.recommendation || "Review this topic and practice trade-off explanations."}</p>
                </div>
                <ArrowRight size={16} />
              </div>
            ))}
          </div>
        </section>

        <Link to="/setup" className="results-back"><ArrowLeft size={15} /> Practice another interview</Link>
      </main>
    </div>
  );
}
