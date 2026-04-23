import { LockButton } from "./LockButton";

interface Props {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  locked: boolean;
  onToggleLock: () => void;
  disabled?: boolean;
}

export function SlotSelect({
  label,
  value,
  options,
  onChange,
  locked,
  onToggleLock,
  disabled,
}: Props) {
  return (
    <label className="flex items-end gap-2 text-sm">
      <div className="flex-1 min-w-0">
        <div className="text-slate-600 dark:text-slate-400 mb-1">{label}</div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={
            "w-full px-2 py-1.5 rounded-md border text-sm bg-white text-slate-900 " +
            "border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 " +
            "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 " +
            (disabled ? "opacity-40 cursor-not-allowed" : "")
          }
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <LockButton
        locked={locked}
        onToggle={onToggleLock}
        disabled={disabled}
        title={`Click to lock this ${label.toLowerCase()} when randomizing`}
      />
    </label>
  );
}
