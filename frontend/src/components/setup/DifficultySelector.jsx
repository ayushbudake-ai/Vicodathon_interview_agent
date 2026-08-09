import { Award, Zap, Flame } from "lucide-react";

export const difficulties = [
  {
    id: "Beginner",
    title: "Beginner",
    icon: Award,
    description: "Fundamentals and basic implementation knowledge. Evaluates core concepts, syntax, and foundational definitions."
  },
  {
    id: "Intermediate",
    title: "Intermediate",
    icon: Zap,
    description: "Practical engineering knowledge, trade-offs and debugging. Evaluates hands-on project experience and problem solving."
  },
  {
    id: "Advanced",
    title: "Advanced",
    icon: Flame,
    description: "Architecture, scalability, production reliability, edge cases and deep technical reasoning. Tests senior-level engineering."
  }
];

export default function DifficultySelector({ selectedDifficulty, onSelectDifficulty }) {
  return (
    <div className="selector-container">
      <div className="selector-heading">
        <span className="small-label">STEP 2 · INTERVIEW DIFFICULTY</span>
        <h2>Select Interview Difficulty</h2>
        <p>Set the baseline depth and complexity of questions asked by the AI interviewer.</p>
      </div>

      <div className="difficulty-grid">
        {difficulties.map((diff) => {
          const Icon = diff.icon;
          const isSelected = (selectedDifficulty || "").toLowerCase() === diff.id.toLowerCase();
          return (
            <button
              key={diff.id}
              type="button"
              data-testid={`difficulty-${diff.id}`}
              className={`difficulty-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectDifficulty(diff.id)}
            >
              <div className="difficulty-card-header">
                <div className={`difficulty-icon-wrapper ${diff.id.toLowerCase()}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <strong>{diff.title}</strong>
                  <span className="difficulty-pill">{diff.id}</span>
                </div>
              </div>
              <p>{diff.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
