export default function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-dashed px-6 py-10 text-center"
      style={{ borderColor: "var(--edu-border)", background: "var(--edu-surface)" }}
    >
      {children}
    </div>
  );
}
