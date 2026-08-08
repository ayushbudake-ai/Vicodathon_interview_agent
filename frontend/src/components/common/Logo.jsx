import { Sparkles } from "lucide-react";

export default function Logo({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark"><Sparkles size={15} strokeWidth={2.4} /></span>
      {!compact && <span>SIGNALROOM</span>}
    </div>
  );
}
