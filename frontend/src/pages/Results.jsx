import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Sparkles, Target, RefreshCw, Layers, ShieldCheck, SendHorizonal } from "lucide-react";
import Logo from "../components/common/Logo";
import { useInterview } from "../context/InterviewContext";

export default function Results() {
  const { sessionId } = useParams();
  const { results, sessionState, candidate, feedbackStatus, fetchFeedback, chatState, sendChatMessage } = useInterview();
  const [draft, setDraft] = useState("");

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
              ? "Synthesizing answers, technical depth, and domain-specific evidence..."
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

  const domain = results.domain || localStorage.getItem("selectedDomain") || "Backend Development";
  const difficulty = results.difficulty || localStorage.getItem("selectedDifficulty") || "Advanced";

  const competencies = [
    ["Technical Knowledge", results.technical],
    ["Problem Solving", results.problemSolving],
    ["System Design", results.systemDesign],
    ["Production Thinking", results.production],
    ["Communication", results.communication],
    ["Practical Experience", results.practicalExperience]
  ];

  // Section 32 & 33: Topic Coverage % vs Performance Score
  const topicBreakdown = results.topicBreakdown || [];
  const suggestions = useMemo(() => [
    "Why did I get this score?",
    "What were my strongest answers?",
    "What should I improve?",
    "Which answer hurt my score the most?",
    "What should I study next?"
  ], []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setDraft("");
    sendChatMessage(message);
  };

  return (
    <div className="app-dark results-app">
      <header className="results-header">
        <Link to="/"><Logo /></Link>
        <span className="setup-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={13} /> {domain.toUpperCase()} · <ShieldCheck size={13} /> {difficulty.toUpperCase()}
        </span>
        <Link to="/setup" className="new-interview">New interview <ArrowRight size={15} /></Link>
      </header>

      <main className="results-main">
        <div className="results-intro">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> {domain} Competency Assessment</div>
            <h1>Technical Signal &<br /><span>Evidence-Based Feedback.</span></h1>
          </div>
          <p>Evaluation conducted for candidate <strong>{candidate?.name || "Candidate"}</strong> at <strong>{difficulty}</strong> level in <strong>{domain}</strong>.</p>
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
              {results.overall >= 82 ? "Strong Senior Signal" : results.overall >= 70 ? "Competent Engineering Signal" : "Foundational Progress"}
            </h2>
            <p>{results.scoreExplanation || results.recommendation || "Your interview performance demonstrated practical reasoning across technical scenarios."}</p>
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
          {/* 6-Dimension Competency Model */}
          <article className="report-card">
            <div className="card-header">
              <div>
                <span className="small-label">6-DIMENSION COMPETENCY MODEL</span>
                <h2>Independent Skill Breakdown</h2>
              </div>
              <span className="completion-pill">0 - 100</span>
            </div>
            {competencies.map(([name, score]) => (
              <div className="skill-row" key={name}>
                <div>
                  <span>{name}</span>
                  <strong>{score ?? 70} / 100</strong>
                </div>
                <div className="skill-track">
                  <i style={{ width: `${score ?? 70}%` }} />
                </div>
              </div>
            ))}
          </article>

          {/* Topic Coverage % vs Performance Score */}
          <article className="report-card">
            <div className="card-header">
              <div>
                <span className="small-label">TOPIC BREAKDOWN</span>
                <h2>Topic Coverage vs Performance</h2>
              </div>
              <span className="completion-pill">Question Distribution</span>
            </div>
            <div className="topic-score-list">
              {topicBreakdown.length > 0 ? (
                topicBreakdown.map((item) => (
                  <div className="topic-score-enhanced" key={item.topic}>
                    <div className="topic-score-meta">
                      <strong>{item.topic}</strong>
                      <div className="topic-metrics-badges">
                        <span className="coverage-badge">Coverage: {item.coveragePercentage}%</span>
                        <span className="perf-badge">Performance: {item.performanceScore}/100</span>
                      </div>
                    </div>
                    <div className="skill-track" style={{ marginTop: 6 }}>
                      <i style={{ width: `${item.performanceScore}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                (results.topicScores || []).map(([topic, score]) => (
                  <div className="topic-score-enhanced" key={topic}>
                    <div className="topic-score-meta">
                      <strong>{topic}</strong>
                      <div className="topic-metrics-badges">
                        <span className="coverage-badge">Coverage: 20%</span>
                        <span className="perf-badge">Performance: {score}/100</span>
                      </div>
                    </div>
                    <div className="skill-track" style={{ marginTop: 6 }}>
                      <i style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        {/* What Stood Out & What to Strengthen */}
        <section className="insights-grid">
          <article className="insight-card positive">
            <div className="insight-icon"><CheckCircle2 size={19} /></div>
            <div>
              <span className="small-label">GROUNDED EVIDENCE</span>
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

        {/* Personalized Recommended Focus Areas */}
        <section className="learning-plan">
          <div>
            <div className="eyebrow"><Target size={14} /> Actionable Next Steps</div>
            <h2>Recommended Focus Areas</h2>
            <p>Personalized topics derived from your {domain} interview responses.</p>
          </div>
          <div className="plan-list">
            {(results.focusedAreas && results.focusedAreas.length > 0
              ? results.focusedAreas
              : (results.topicsToRevise || []).map((title, index) => ({
                  step: String(index + 1).padStart(2, "0"),
                  topic: title,
                  why: "Coverage & Performance signal",
                  evidence: (results.recommendations || [])[index] || "Review core mechanisms and trade-offs.",
                  whatToLearn: "Theoretical mechanisms & architectural patterns",
                  whatToPractice: "Hands-on prototype & benchmark testing"
                }))
            ).slice(0, 4).map((item, index) => (
              <div className="plan-row-enhanced" key={item.topic || index}>
                <span className="plan-num">{item.step || String(index + 1).padStart(2, "0")}</span>
                <div className="plan-details">
                  <strong>{item.topic}</strong>
                  {item.why && <p className="plan-why"><strong>Why:</strong> {item.why}</p>}
                  {item.evidence && <p className="plan-evidence"><strong>Evidence:</strong> {item.evidence}</p>}
                  <div className="plan-actions-chips">
                    {item.whatToLearn && <span className="chip learn">Learn: {item.whatToLearn}</span>}
                    {item.whatToPractice && <span className="chip practice">Practice: {item.whatToPractice}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="chatbot-card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <div>
              <span className="small-label">EVALUATION CHATBOT</span>
              <h2>Ask about your interview report</h2>
            </div>
            <span className="completion-pill">Evidence-grounded</span>
          </div>
          <div className="chatbot-suggestions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" className="chat-suggestion" onClick={() => setDraft(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
          <div className="chatbot-feed">
            {chatState.messages.length === 0 ? (
              <div className="chatbot-empty-state">
                <p>Ask why a score was given, what your strongest answer was, or what to improve next.</p>
              </div>
            ) : (
              chatState.messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-message ${message.role === "assistant" ? "assistant" : "candidate"}`}>
                  <strong>{message.role === "assistant" ? "Coach" : "You"}</strong>
                  <p>{message.content}</p>
                  {message.sources?.length > 0 && (
                    <div className="chat-sources">
                      {message.sources.map((source) => (
                        <span key={`${source.questionId || source.topic}-${index}`}>{source.topic || "Interview evidence"}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            {chatState.loading && <div className="chat-message assistant"><strong>Coach</strong><p>Analyzing your interview evidence…</p></div>}
            {chatState.error && <div className="chat-message assistant"><strong>Coach</strong><p>{chatState.error}</p></div>}
          </div>
          <form onSubmit={handleSubmit} className="chatbot-form">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your score, strengths, weaknesses, or next steps" />
            <button type="submit" disabled={chatState.loading} className="btn btn-primary">
              <SendHorizonal size={15} />
            </button>
          </form>
        </section>

        <Link to="/setup" className="results-back"><ArrowLeft size={15} /> Practice another interview</Link>
      </main>
    </div>
  );
}
