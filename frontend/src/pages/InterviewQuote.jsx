import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/common/Logo";
import { candidates } from "../data";
import { api } from "../services/api";

const fallbackQuotePool = [
  "Let your curiosity lead the way — one thoughtful answer can reveal more than a perfect one ever could.",
  "Clarity beats cleverness. Say exactly what you know, and exactly where you're still figuring it out.",
  "The best answers show your reasoning, not just your conclusion.",
  "Confidence is quiet. Let your explanation do the convincing.",
  "Every strong engineer names the trade-off before anyone has to ask about it.",
  "Slow down enough to think out loud — that's the real interview.",
  "Depth beats breadth: one well-reasoned idea outweighs five surface-level facts.",
  "Treat every question as a chance to show how you actually think.",
  "The strongest signal isn't the answer — it's how you got there.",
  "A great answer names its own assumptions before someone else has to.",
  "Precision is a form of respect for the problem you're solving.",
  "You don't need the perfect answer. You need the honest one.",
  "Explain the 'why' behind your choice, not just the choice itself.",
  "Good engineers are comfortable saying 'it depends' — and then explaining on what.",
  "The goal isn't to sound smart. It's to think clearly, out loud.",
  "Every trade-off you name is a strength the interviewer can see.",
  "Curiosity asks better questions than confidence ever could.",
  "Today is a chance to show your process, not just your polish."
];

let lastLocalQuote = null;

const fallbackQuote = () => {
  const pool = lastLocalQuote
    ? fallbackQuotePool.filter((quote) => quote !== lastLocalQuote)
    : fallbackQuotePool;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  lastLocalQuote = choice;
  return choice;
};

export default function InterviewQuote() {
  const navigate = useNavigate();
  const selectedId = localStorage.getItem("selectedCandidateId");
  const candidate = candidates.find((item) => item.id === selectedId) || candidates[0];
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(true);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const response = await api.getInterviewQuote(candidate.originalId || candidate.id);
      setQuote(response.quote);
    } catch {
      setQuote(fallbackQuote());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuote(); }, []);

  return (
    <div className="app-dark quote-page">
      <div className="quote-shell">
        <header className="setup-header">
          <Logo />
          <span className="setup-label">MINDSET / 05</span>
        </header>

        <main className="quote-main">
          <div className="quote-orbit orbit-a" />
          <div className="quote-orbit orbit-b" />
          <div className="eyebrow"><Sparkles size={14} /> Before you begin</div>
          <p className="quote-kicker">A fresh thought for {candidate.name.split(" ")[0]}</p>
          <div className="quote-card">
            <Sparkles className="quote-spark" size={24} />
            <blockquote>{loading ? "Creating a fresh mindset..." : `“${quote}”`}</blockquote>
            <span className="quote-caption">Generated for this session · change it whenever you want</span>
            <button className="quote-refresh" onClick={loadQuote} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> New quote
            </button>
          </div>
          <div className="quote-actions">
            <button className="back-button" onClick={() => navigate(`/interview/${candidate.id}`)}><ArrowLeft size={15} /> Back</button>
            <button className="btn btn-primary" onClick={() => navigate("/interview")} disabled={loading}>
              Start interview <ArrowRight size={17} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
