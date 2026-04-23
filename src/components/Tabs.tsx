import type { GameId } from "../engine/types";

const tabs: { id: GameId; label: string }[] = [
  { id: "botw", label: "Breath of the Wild" },
  { id: "totk", label: "Tears of the Kingdom" },
];

export function Tabs({
  value,
  onChange,
}: {
  value: GameId;
  onChange: (next: GameId) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={
              "px-3 py-1.5 rounded-md text-sm transition " +
              (active
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
