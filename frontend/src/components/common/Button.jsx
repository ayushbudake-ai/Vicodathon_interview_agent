import { ArrowRight } from "lucide-react";

export default function Button({ children, variant = "primary", onClick, icon = true, type = "button", disabled = false, testId }) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId || "button"}
    >
      <span>{children}</span>
      {icon && variant === "primary" && <ArrowRight size={17} />}
    </button>
  );
}
