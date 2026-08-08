import { useEffect, useState } from "react";
import { Send, Sparkles, Clock3, PanelRightOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/common/Logo";
import Badge from "../components/common/Badge";
import { useInterview } from "../context/InterviewContext";

export default function Interview() {
  const navigate = useNavigate();
  const { candidate, messages, questionNumber, totalQuestions, topics, isLoading, submitAnswer, coveredDays, sessionState, aiMode, feedbackStatus } = useInterview();
  const [answer, setAnswer] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitAnswer(answer);
    setAnswer("");
  };

  const finish = () => {
    if (sessionState.completionState && feedbackStatus !== "loading") navigate("/complete");
  };

  return (
    <div className="interview-app">
      <header className="interview-header">
        <Logo />
        <div className="interview-center">
          <span>TECHNICAL INTERVIEW</span>
          <div data-testid="interview-progress" className="question-track"><i style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} /></div>
        </div>
        <div className="interview-meta">
          <span><Clock3 size={15} /> {elapsedLabel}</span>
          <button data-testid="end-interview" className="finish-button" onClick={finish} disabled={!sessionState.completionState || feedbackStatus === "loading"}>{feedbackStatus === "loading" ? "Preparing feedback…" : "Complete interview"}</button>
        </div>
      </header>

      <main className="interview-layout">
        <section className="conversation">
          {sessionState.error && <div className="next-question-bar" role="alert" data-testid="interview-error">{sessionState.error}</div>}
          <div className="conversation-title">
            <div>
              <span className="small-label">LIVE INTERVIEW</span>
              <h1>Think out loud. <span>Go deep.</span></h1>
              <p className="interview-context">{candidate.name} · Day {coveredDays.at(-1) || "—"} · {sessionState.currentTopic || "Preparing interview"} · {aiMode === "live" ? "AI live" : aiMode === "error" ? "Connection issue" : "Connecting AI"}</p>
            </div>
            <Badge>Question {questionNumber} / {totalQuestions}</Badge>
          </div>

          <div className="messages">
            {messages.map((message) => (
              <div key={message.id} className={`message-row ${message.role}`}>
                {message.role === "ai" ? (
                  <div className="ai-avatar"><Sparkles size={17} /></div>
                ) : <div className="you-label">YOU</div>}
                <div className="message-content">
                  <div className="message-meta">
                    {message.role === "ai" ? <><strong>AI Interviewer</strong><span>{message.topic}</span></> : <strong>Your answer</strong>}
                  </div>
                  <div className={`message-bubble ${message.role}`}>{message.text}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-row ai">
                <div className="ai-avatar"><Sparkles size={17} /></div>
                <div className="message-content">
                  <div className="message-meta"><strong>AI Interviewer</strong><span>Thinking</span></div>
                  <div className="message-bubble ai typing"><i /><i /><i /></div>
                </div>
              </div>
            )}
          </div>

          <form className="answer-box" onSubmit={handleSubmit}>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain your reasoning..."
              rows={4}
              disabled={isLoading}
              data-testid="answer-input"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />
            <div className="answer-toolbar">
              <span>Tip: Explain your trade-offs, not just your final answer.</span>
              <button data-testid="submit-answer" className="send-button" disabled={!answer.trim() || isLoading || !sessionState.currentQuestion || sessionState.completionState} aria-label="Submit answer">
                <Send size={17} />
              </button>
            </div>
          </form>
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
            <div><span>Interview progress · {coveredDays.length} curriculum days</span><strong>{Math.round((questionNumber / totalQuestions) * 100)}%</strong></div>
            <div className="progress-track"><i style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} /></div>
          </div>

          <div className="topic-timeline">
            {topics.map((topic) => (
              <div className={`topic-item ${topic.status}`} key={topic.id}>
                <div className="topic-dot">{topic.status === "complete" ? "✓" : topic.status === "current" ? "•" : ""}</div>
                <div><strong>{topic.name}</strong><span>{topic.status === "complete" ? "Explored" : topic.status === "current" ? "Current focus" : "Coming up"}</span></div>
              </div>
            ))}
          </div>

          <div className="interview-note">
            <Sparkles size={16} />
            <p>The agent may revisit a topic when your answer reveals an interesting technical gap.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
