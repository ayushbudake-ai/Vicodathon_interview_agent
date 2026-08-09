import { Link } from "react-router-dom";
import { Menu, ArrowRight } from "lucide-react";
import Logo from "../common/Logo";

export default function Navbar({ minimal = false }) {
  return (
    <header className={`navbar ${minimal ? "navbar-minimal" : ""}`}>
      <Link to="/" className="nav-logo"><Logo /></Link>
      {!minimal && (
        <>
          <nav className="nav-links" aria-label="Main navigation">
            <a data-testid="nav-how-it-works" href="#how-it-works">How it works</a>
            <a data-testid="nav-curriculum" href="#topics">Curriculum</a>
            <a data-testid="nav-features" href="#features">Features</a>
          </nav>
          <Link to="/candidates" className="nav-cta btn-nav-cta">
            Start Interview <ArrowRight size={15} />
          </Link>
          <button className="mobile-menu" aria-label="Open menu"><Menu size={20} /></button>
        </>
      )}
    </header>
  );
}
