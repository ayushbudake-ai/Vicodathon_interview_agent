import { useEffect, useState } from "react";
import { Send, Sparkles, Clock3, PanelRightOpen, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/common/Logo";
import Badge from "../components/common/Badge";
import { useInterview } from "../context/InterviewContext";

export default function Interview() {
  const navigate = useNavigate();
  const {
    candidate,
    messages,
    questionNumber,
    totalQuestions,
    topics,
    isLoading,
    statusState,
    submitAnswer,
    coveredDays,
    sessionState,
    aiMode,
    feedbackStatus,
    retryStart
  } = useInterview();

  const [answer, setAnswer] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const updateElapsed = () => {
      if (!sessionState?.startedAt) return;
      const startMs = new Date(sessionState.startedAt).getTime();
      const nowMs = Date.now();
      const diff = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [sessionState?.startedAt]);

  const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!answer.trim() || isLoading || !sessionState.currentQuestion) return;
    const textToSubmit = answer;
    setAnswer("");
    await submitAnswer(textToSubmit);
  };

  const finish = () => {
    const targetSessionId = sessionState.sessionId || localStorage.getItem("activeSessionId");
    if (sessionState.completionState) {
      navigate(targetSessionId ? `/results/${targetSessionId}` : "/results");
    }
  };

  const isCompleted = sessionState.completionState || statusState === "COMPLETED" || statusState === "RESULTS";

  return (
    <div className="interview-app">
      <header className="interview-header">
        <Logo />
        <div className="interview-center">
          <span>{sessionState?.domain || "TECHNICAL INTERVIEW"}</span>
          <div data-testid="interview-progress" className="question-track">
            <i style={{ width: `${Math.min(100, (questionNumber / totalQuestions) * 100)}%` }} />
          </div>
        </div>
        <div className="interview-meta">
          <span><Clock3 size={15} /> {elapsedLabel}</span>
          <button
            data-testid="end-interview"
            className="finish-button"
            onClick={finish}
            disabled={!isCompleted || feedbackStatus === "loading"}
          >
            {feedbackStatus === "loading" ? "Preparing feedback…" : isCompleted ? "View Results →" : "In Progress"}
          </button>
        </div>
      </header>

      <main className="interview-layout">
        <section className="conversation">
          {sessionState.error && statusState === "ERROR" && (
            <div className="next-question-bar" role="alert" data-testid="interview-error" style={{ background: "rgba(239, 68, 68, 0.15)", borderColor: "#ef4444", color: "#fca5a5" }}>
              <AlertTriangle size={18} />
              <div style={{ flex: 1 }}>
                <strong>Interview Connection Issue:</strong> {sessionState.error}
              </div>
              <button
                onClick={retryStart}
                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          )}

          <div className="conversation-title">
            <div>
              <span className="small-label">{sessionState?.domain?.toUpperCase() || "DOMAIN"} ASSESSMENT</span>
              <h1>Think out loud. <span>Go deep.</span></h1>
              <p className="interview-context">
                {candidate?.name || "Candidate"} · {sessionState?.role || "Engineer"} · {sessionState?.experienceLevel || "Intermediate"} · {sessionState?.currentTopic || "Preparing session"}
              </p>
            </div>
            <Badge>Question {questionNumber} / {totalQuestions}</Badge>
          </div>

          <div className="messages">
            {/* Initial Loading Screen */}
            {(statusState === "INITIALIZING" || statusState === "STARTING") && !messages.length && (
              <div className="message-row ai">
                <div className="ai-avatar"><Sparkles size={17} /></div>
                <div className="message-content">
                  <div className="message-meta"><strong>AI Interviewer</strong><span>Starting session...</span></div>
                  <div className="message-bubble ai">
                    Connecting to AI interviewer and generating opening question for {sessionState?.role || "Candidate"} ({sessionState?.domain || "Domain"})...
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((message) => (
              <div key={message.id} className={`message-row ${message.role}`}>
                {message.role === "ai" ? (
                  <div className="ai-avatar"><Sparkles size={17} /></div>
                ) : (
                  <div className="you-label">YOU</div>
                )}
                <div className="message-content">
                  <div className="message-meta">
                    {message.role === "ai" ? (
                      <>
                        <strong>AI Interviewer</strong>
                        <span>{message.topic || "Question"}</span>
                        {message.adaptive && <span style={{ color: "#38bdf8", marginLeft: 6 }}>✦ Adaptive Follow-up</span>}
                      </>
                    ) : (
                      <strong>Your answer</strong>
                    )}
                  </div>
                  <div className={`message-bubble ${message.role}`}>{message.text}</div>
                </div>
              </div>
            ))}

            {/* Thinking / Evaluating Indicator */}
            {(isLoading || statusState === "SUBMITTING_ANSWER" || statusState === "GENERATING_NEXT_QUESTION") && (
              <div className="message-row ai">
                <div className="ai-avatar"><Sparkles size={17} className="spin" /></div>
                <div className="message-content">
                  <div className="message-meta">
                    <strong>AI Interviewer</strong>
                    <span>{statusState === "SUBMITTING_ANSWER" ? "Evaluating your technical answer..." : "Generating domain follow-up..."}</span>
                  </div>
                  <div className="message-bubble ai typing"><i /><i /><i /></div>
                </div>
              </div>
            )}

            {/* Completed Banner */}
            {isCompleted && (
              <div className="message-row ai" style={{ marginTop: 16 }}>
                <div className="ai-avatar" style={{ background: "#22c55e" }}><CheckCircle2 size={18} color="#fff" /></div>
                <div className="message-content">
                  <div className="message-meta"><strong>AI Interviewer</strong><span>Session Complete</span></div>
                  <div className="message-bubble ai" style={{ borderColor: "#22c55e", background: "rgba(34, 197, 94, 0.1)" }}>
                    Thank you! You have completed the technical interview for <strong>{sessionState?.role}</strong> ({sessionState?.domain}). Click <strong>"View Results"</strong> above to inspect your structured feedback report.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Answer Input Form */}
          <form className="answer-box" onSubmit={handleSubmit}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={isCompleted ? "Interview completed." : "Explain your technical approach, reasoning, and trade-offs..."}
              rows={4}
              disabled={isLoading || isCompleted || !sessionState.currentQuestion}
              data-testid="answer-input"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey || !event.shiftKey)) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />
            <div className="answer-toolbar">
              <span>Tip: Shift+Enter for new line. Press Enter or Send to submit.</span>
              <button
                data-testid="submit-answer"
                className="send-button"
                disabled={!answer.trim() || isLoading || isCompleted || !sessionState.currentQuestion}
                aria-label="Submit answer"
              >
                <Send size={17} />
              </button>
            </div>
          </form>
        </section>

        <aside className="journey-sidebar">
          <div className="sidebar-top">
            <div>
              <span className="small-label">CURRICULUM & DOMAIN MAP</span>
              <h2>{sessionState?.domain || "Interview Map"}</h2>
            </div>
            <button className="sidebar-toggle"><PanelRightOpen size={17} /></button>
          </div>

          <div className="sidebar-progress">
            <div>
              <span>Interview progress · {coveredDays.length} days covered</span>
              <strong>{Math.round((questionNumber / totalQuestions) * 100)}%</strong>
            </div>
            <div className="progress-track">
              <i style={{ width: `${Math.min(100, (questionNumber / totalQuestions) * 100)}%` }} />
            </div>
          </div>

          <div className="topic-timeline">
            {topics.map((topic) => (
              <div className={`topic-item ${topic.status}`} key={topic.id || topic.name}>
                <div className="topic-dot">{topic.status === "complete" ? "✓" : topic.status === "current" ? "•" : ""}</div>
                <div>
                  <strong>{topic.name}</strong>
                  <span>{topic.status === "complete" ? "Explored" : topic.status === "current" ? "Current focus" : "Coming up"}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="interview-note">
            <Sparkles size={16} />
            <p>The AI interviewer adapts difficulty and probes deeper when your answers reveal technical trade-offs.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
