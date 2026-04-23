import lockLight from "../assets/lock.png";
import lockDark from "../assets/lock_dark.png";
import unlockLight from "../assets/unlock.png";
import unlockDark from "../assets/unlock_dark.png";

interface Props {
  locked: boolean;
  onToggle: () => void;
  title?: string;
  disabled?: boolean;
}

export function LockButton({ locked, onToggle, title, disabled }: Props) {
  const light = locked ? lockLight : unlockLight;
  const dark = locked ? lockDark : unlockDark;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={title ?? (locked ? "Unlock" : "Lock when randomizing")}
      aria-pressed={locked}
      aria-label={locked ? "Unlock" : "Lock"}
      className={
        "shrink-0 inline-flex items-center justify-center p-1 bg-transparent border-0 " +
        "opacity-60 hover:opacity-100 transition-opacity " +
        (disabled ? "!opacity-20 cursor-not-allowed" : "cursor-pointer")
      }
    >
      <img src={light} alt="" className="h-5 w-5 dark:hidden" />
      <img src={dark} alt="" className="h-5 w-5 hidden dark:block" />
    </button>
  );
}
