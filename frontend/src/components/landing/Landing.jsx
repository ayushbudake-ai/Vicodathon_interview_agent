import Navbar from "../layout/Navbar";
import Hero from "./Hero";
import FeatureGrid from "./FeatureGrid";
import HowItWorks from "./HowItWorks";
import CurriculumStrip from "./CurriculumStrip";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div>
      <Navbar />
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <CurriculumStrip />
      <section className="final-cta section-container">
        <div className="final-cta-glow" />
        <div>
          <div className="eyebrow">Ready when you are</div>
          <h2>Practice like the<br /><span>real thing.</span></h2>
        </div>
        <Link data-testid="start-interview-footer" to="/candidates" className="btn btn-primary">Start Interview <ArrowRight size={17} /></Link>
      </section>
      <footer className="footer section-container">
        <span>© 2026 AI Cohort</span>
        <span>Adaptive technical interview agent</span>
      </footer>
    </div>
  );
}
