interface FilterButtonProps {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}

export default function FilterButton({
  active,
  count,
  label,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all"
      style={{
        borderColor: active ? "var(--edu-primary)" : "var(--edu-border)",
        background: active ? "var(--edu-primary)" : "var(--edu-surface)",
        color: active ? "white" : "var(--edu-text-secondary)",
      }}
    >
      {label}
      <span
        style={{
          color: active ? "rgba(255,255,255,0.7)" : "var(--edu-text-muted)",
        }}
      >
        {count}
      </span>
    </button>
  );
}
