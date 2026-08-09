import { useEffect, useRef, useState } from "react";
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
    finishInterview,
    coveredDays,
    sessionState,
    aiMode,
    feedbackStatus,
    retryStart
  } = useInterview();

  const [answer, setAnswer] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const answerInputRef = useRef(null);
  const continueButtonRef = useRef(null);
  const submitAnswersButtonRef = useRef(null);

  // Timer calculated based on session.startedAt so refresh doesn't reset time
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
  const isFinishingInterview = statusState === "FINISHING_INTERVIEW" || feedbackStatus === "loading";
  const answeredCount = sessionState.answers?.length || 0;

  useEffect(() => {
    if (!isCompleted && !isLoading && !showSubmitConfirmation && sessionState.currentQuestion) {
      answerInputRef.current?.focus();
    }
  }, [sessionState.currentQuestion?.id, isCompleted, isLoading, showSubmitConfirmation]);

  useEffect(() => {
    if (!showSubmitConfirmation) return undefined;
    continueButtonRef.current?.focus();
    const handleEscape = (event) => {
      if (event.key === "Escape" && !isFinishingInterview) setShowSubmitConfirmation(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showSubmitConfirmation, isFinishingInterview]);

  const continueInterview = () => {
    setShowSubmitConfirmation(false);
    window.setTimeout(() => answerInputRef.current?.focus(), 0);
  };

  const confirmFinish = async () => {
    if (isFinishingInterview) return;
    await finishInterview();
    setShowSubmitConfirmation(false);
  };

  return (
    <div className="interview-app">
      <header className="interview-header">
        <Logo />
        <div className="interview-center">
          <span>TECHNICAL INTERVIEW</span>
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
              <span className="small-label">LIVE ADAPTIVE INTERVIEW</span>
              <h1>Think out loud. <span>Go deep.</span></h1>
              <p className="interview-context">
                {candidate?.name || "Candidate"} · {sessionState?.domain || localStorage.getItem("selectedDomain") || "Backend Development"} ({sessionState?.difficulty || localStorage.getItem("selectedDifficulty") || "Advanced"}) · {sessionState?.currentTopic || "Preparing session"}
              </p>
            </div>
            <Badge>Question {questionNumber} / {totalQuestions}</Badge>
          </div>

          <div className="messages">
            {/* Show Initial Loading Screen if session is starting */}
            {(statusState === "INITIALIZING" || statusState === "STARTING") && !messages.length && (
              <div className="message-row ai">
                <div className="ai-avatar"><Sparkles size={17} /></div>
                <div className="message-content">
                  <div className="message-meta"><strong>AI Interviewer</strong><span>Initializing</span></div>
                  <div className="message-bubble ai">
                    Connecting to AI interviewer and generating opening question...
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
                    <span>{statusState === "SUBMITTING_ANSWER" ? "Analyzing your answer..." : "Preparing next question..."}</span>
                  </div>
                  <div className="message-bubble ai typing"><i /><i /><i /></div>
                </div>
              </div>
            )}

            {/* Completed Banner below final answer */}
            {isCompleted && (
              <div className="interview-complete-cta-card" data-testid="interview-complete-cta" style={{ marginTop: 24 }}>
                <div className="complete-cta-header">
                  <div className="ai-avatar" style={{ background: "#22c55e", border: "none" }}>
                    <CheckCircle2 size={20} color="#fff" />
                  </div>
                  <div>
                    <span className="small-label" style={{ color: "#4ade80" }}>INTERVIEW COMPLETE</span>
                    <h2 style={{ margin: "4px 0 0", fontSize: 20, color: "#fff" }}>Your interview has been evaluated.</h2>
                  </div>
                </div>
                <p style={{ color: "#a1a1aa", fontSize: 13, margin: "14px 0 20px", lineHeight: 1.6 }}>
                  All questions and answers have been recorded. Click below to view your domain-specific competency report.
                </p>
                <button
                  data-testid="end-interview-primary"
                  className="btn btn-primary"
                  onClick={finish}
                  disabled={feedbackStatus === "loading"}
                  style={{ width: "100%", padding: "14px 20px", fontSize: 14, fontWeight: 700, borderRadius: 8 }}
                >
                  {feedbackStatus === "loading" ? "Building your report..." : "VIEW RESULTS →"}
                </button>
              </div>
            )}
          </div>

          {/* Answer Input Form — Hidden when interview is completed */}
          {!isCompleted && (
            <form className="answer-box" onSubmit={handleSubmit}>
              <textarea
                ref={answerInputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Explain your technical approach, reasoning, and trade-offs..."
                rows={4}
                disabled={isLoading || !sessionState.currentQuestion}
                data-testid="answer-input"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
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
                  disabled={!answer.trim() || isLoading || !sessionState.currentQuestion}
                  aria-label="Submit answer"
                >
                  <Send size={17} />
                </button>
              </div>
              <button
                type="button"
                className="submit-interview-button"
                onClick={() => setShowSubmitConfirmation(true)}
                disabled={isLoading || !sessionState.currentQuestion}
              >
                Submit Interview
              </button>
            </form>
          )}

          {showSubmitConfirmation && !isCompleted && (
            <div className="submit-confirmation-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isFinishingInterview) continueInterview();
            }}>
              <section
                className="submit-confirmation-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="submit-interview-title"
                aria-describedby="submit-interview-description"
                onKeyDown={(event) => {
                  if (event.key === "Tab") {
                    event.preventDefault();
                    (event.shiftKey ? submitAnswersButtonRef : continueButtonRef).current?.focus();
                  }
                }}
              >
                <span className="small-label">FINISH EARLY</span>
                <h2 id="submit-interview-title">Submit Interview?</h2>
                <p id="submit-interview-description">
                  You have answered {answeredCount} of {totalQuestions} questions. The remaining questions will be left unanswered and your completed answers will be evaluated.
                </p>
                <div className="submit-confirmation-actions">
                  <button ref={continueButtonRef} type="button" className="btn btn-secondary" onClick={continueInterview} disabled={isFinishingInterview}>
                    Continue Interview
                  </button>
                  <button ref={submitAnswersButtonRef} type="button" className="btn btn-primary" onClick={confirmFinish} disabled={isFinishingInterview}>
                    {isFinishingInterview ? "Analyzing your interview..." : "Submit Answers"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>

        <aside className="journey-sidebar">
          <div className="sidebar-top">
            <div>
              <span className="small-label">YOUR JOURNEY</span>
              <h2>Interview map</h2>
            </div>
            <button className="sidebar-toggle"><PanelRightOpen size={17} /></button>
          </div>

          <div className="sidebar-progress">
            <div>
              <span>Interview progress · {coveredDays.length} topics covered</span>
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

