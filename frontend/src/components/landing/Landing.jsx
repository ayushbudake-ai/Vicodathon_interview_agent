import Navbar from "../layout/Navbar";
import Hero from "./Hero";
import FeatureGrid from "./FeatureGrid";
import HowItWorks from "./HowItWorks";
import CurriculumStrip from "./CurriculumStrip";

export default function Landing() {
  return (
    <div>
      <Navbar />
      <Hero />
      <FeatureGrid />
      <CurriculumStrip />
      <HowItWorks />
      <footer className="footer section-container">
        <span>© 2026 AI Cohort</span>
        <span>Adaptive technical interview agent</span>
      </footer>
    </div>
  );
}
