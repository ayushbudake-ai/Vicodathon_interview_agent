const steps = [
  ["01", "Understand", "We map your interview to the topics and missions you actually completed."],
  ["02", "Interview", "The agent asks technical questions and follows your answers naturally."],
  ["03", "Evaluate", "Your responses are assessed across technical and engineering dimensions."],
  ["04", "Improve", "You get a focused report and the next topics to work on."]
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-container section-block how-section">
      <div className="section-heading centered">
        <div className="eyebrow">Simple by design</div>
        <h2>From learning to <span>confidence.</span></h2>
        <p>A four-step experience that feels like a real technical interview.</p>
      </div>
      <div className="steps-grid">
        {steps.map(([number, title, text]) => (
          <article className="step-card" key={number}>
            <span className="step-number">{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
