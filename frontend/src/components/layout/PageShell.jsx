export default function PageShell({ children, className = "" }) {
  return <main className={`page-shell ${className}`}>{children}</main>;
}
