import { useEffect, useState } from "react";
import { Tabs } from "./components/Tabs";
import { BotWApp } from "./games/botw/BotWApp";
import { TotKPlaceholder } from "./games/totk/TotKPlaceholder";
import type { GameId } from "./engine/types";

function readTabFromHash(): GameId {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith("totk")) return "totk";
  return "botw";
}

const THEME_STORAGE_KEY = "fotw:theme";

function readInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark") return true;
    if (saved === "light") return false;
  } catch {
    /* ignore */
  }
  // Fall back to browser preference; default to dark when unknown.
  if (typeof window.matchMedia === "function") {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    return !mq.matches;
  }
  return true;
}

export default function App() {
  const [tab, setTab] = useState<GameId>(readTabFromHash);
  const [dark, setDark] = useState<boolean>(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  return (
    <div className="min-h-full flex flex-col">
      <header className="relative">
        <div
          className="h-[150px] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: "url(/header.jpg)" }}
        >
          <h1 className="font-zelda text-white text-5xl sm:text-6xl title-glow tracking-wide">
            Fashion of the Wild
          </h1>
        </div>
      </header>

      <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-stone-300 dark:border-slate-700 bg-stone-100/80 dark:bg-slate-900/80 backdrop-blur">
        <Tabs value={tab} onChange={setTab} />
        <button
          onClick={() => setDark((d) => !d)}
          className="text-sm px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {dark ? "Light Mode" : "Night Mode"}
        </button>
      </div>

      {/*
        Both tabs stay mounted so each keeps its state across tab switches.
        Only the active tab drives the URL fragment (see useBotWOutfit).
      */}
      <main className="flex-1">
        <div style={{ display: tab === "botw" ? "block" : "none" }}>
          <BotWApp isActive={tab === "botw"} />
        </div>
        <div style={{ display: tab === "totk" ? "block" : "none" }}>
          <TotKPlaceholder />
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
        All equipment names and images are copyright Nintendo Co., Ltd.
      </footer>
    </div>
  );
}
