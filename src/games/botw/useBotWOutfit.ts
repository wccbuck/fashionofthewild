import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CUSTOM_SET,
  DEFAULT_COLOR,
  DEFAULT_LOCKS,
  DEFAULT_OUTFIT,
  NONE,
} from "../../engine/types";
import type { Filters, LockKey, Locks, Outfit } from "../../engine/types";
import {
  decodeOutfit,
  encodeOutfit,
  formatHash,
  parseHash,
} from "../../engine/urlState";
import {
  BOTW_URL_TABLES,
  COLORS,
  getBodies,
  getBows,
  getHeads,
  getLegs,
  getSetPieces,
  getShields,
  getWeapons,
  setNameFor,
} from "./game";
import { hasColors } from "./compositor";

const FILTERS_STORAGE_KEY = "fotw:filters";

function readInitialFilters(): Filters {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) return { amiibo: false, dlc: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { amiibo: true, dlc: true };
}

function readInitialOutfit(): Outfit {
  const { game, body } = parseHash(window.location.hash);
  if (game !== "botw" || !body) return DEFAULT_OUTFIT;
  return decodeOutfit(body, BOTW_URL_TABLES);
}

/**
 * One big state hook for the BotW editor. Handles:
 *   - outfit <-> URL fragment sync (only while the tab is active)
 *   - Amiibo/DLC filter persistence
 *   - per-slot locks
 *   - armor set application
 *   - randomize respecting locks
 *   - color auto-defaulting for non-dyeable items
 *
 * `isActive` = whether this tab is the visible one. While inactive, the hook
 * skips writing to the URL and ignores hashchange events so the other tab's
 * URL isn't clobbered. When re-activated, it pushes its current outfit back
 * into the URL.
 */
export function useBotWOutfit({ isActive }: { isActive: boolean }) {
  const [outfit, setOutfit] = useState<Outfit>(readInitialOutfit);
  const [locks, setLocks] = useState<Locks>(DEFAULT_LOCKS);
  const [filters, setFilters] = useState<Filters>(readInitialFilters);
  const [currentSet, setCurrentSet] = useState<string>(() =>
    setNameFor(outfit.head, outfit.body, outfit.legs),
  );
  // The "set color" the user has picked. Independent of individual piece
  // colors so the dropdown doesn't snap back to [Default] when one of the
  // pieces happens to be non-dyeable.
  const [setColor, setSetColor] = useState<string>(DEFAULT_COLOR);

  // Persist filters
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);

  // Sync outfit → URL fragment when active. We ignore hash events we write
  // ourselves.
  const suppressHashSync = useRef(false);
  useEffect(() => {
    if (!isActive) return;
    const body = encodeOutfit(outfit, BOTW_URL_TABLES);
    const next = formatHash("botw", body);
    if (window.location.hash !== next) {
      suppressHashSync.current = true;
      history.replaceState(null, "", next);
      queueMicrotask(() => (suppressHashSync.current = false));
    }
  }, [outfit, isActive]);

  // Sync URL → outfit on external hash change (back button, pasted link).
  useEffect(() => {
    if (!isActive) return;
    const onHashChange = () => {
      if (suppressHashSync.current) return;
      const { game, body } = parseHash(window.location.hash);
      if (game === "botw") {
        const next = decodeOutfit(body, BOTW_URL_TABLES);
        setOutfit(next);
        setCurrentSet(setNameFor(next.head, next.body, next.legs));
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [isActive]);

  // Slot options (derived from filters)
  const options = useMemo(() => {
    return {
      heads: getHeads(filters),
      bodies: getBodies(filters),
      legs: getLegs(filters),
      weapons: getWeapons(filters),
      shields: getShields(filters),
      bows: getBows(filters),
      colors: COLORS,
    };
  }, [filters]);

  // If the user unchecks Amiibo or DLC while wearing an item from that bucket,
  // the item is no longer in its dropdown — strip it from the outfit so the
  // selects and preview stay in sync. Also recompute currentSet so the Full
  // Set dropdown reflects the new combination.
  useEffect(() => {
    setOutfit((o) => {
      const next = { ...o };
      let changed = false;
      if (!options.heads.includes(o.head)) { next.head = NONE; next.headColor = DEFAULT_COLOR; changed = true; }
      if (!options.bodies.includes(o.body)) { next.body = NONE; next.bodyColor = DEFAULT_COLOR; changed = true; }
      if (!options.legs.includes(o.legs)) { next.legs = NONE; next.legsColor = DEFAULT_COLOR; changed = true; }
      if (!options.weapons.includes(o.weapon)) { next.weapon = NONE; changed = true; }
      if (!options.shields.includes(o.shield)) { next.shield = NONE; changed = true; }
      if (!options.bows.includes(o.bow)) { next.bow = NONE; changed = true; }
      if (!changed) return o;
      setCurrentSet(setNameFor(next.head, next.body, next.legs));
      return next;
    });
  }, [options]);

  // --- Mutators ---

  const toggleLock = useCallback((key: LockKey) => {
    setLocks((l) => {
      const nowLocked = !l[key];
      const next = { ...l, [key]: nowLocked };
      if (key === "headColor") {
        next.lockedHeadColor = nowLocked ? outfit.headColor : undefined;
      }
      if (key === "bodyColor") {
        next.lockedBodyColor = nowLocked ? outfit.bodyColor : undefined;
      }
      if (key === "legsColor") {
        next.lockedLegsColor = nowLocked ? outfit.legsColor : undefined;
      }
      return next;
    });
  }, [outfit]);

  // "Full Set" lock is just the AND of the three piece locks — toggling it
  // cascades to head/body/legs so the individual lock icons reflect reality.
  const isFullSetLocked = locks.head && locks.body && locks.legs;
  const toggleFullSetLock = useCallback(() => {
    setLocks((l) => {
      const allLocked = l.head && l.body && l.legs;
      const next = !allLocked;
      return { ...l, head: next, body: next, legs: next };
    });
  }, []);

  // "Set Color" lock — AND of the three color locks. When locking, we capture
  // the current head color as the shared locked value on all three slots.
  const isSetColorLocked =
    locks.headColor && locks.bodyColor && locks.legsColor;
  const toggleSetColorLock = useCallback(() => {
    setLocks((l) => {
      const allLocked = l.headColor && l.bodyColor && l.legsColor;
      if (allLocked) {
        return {
          ...l,
          headColor: false,
          bodyColor: false,
          legsColor: false,
          lockedHeadColor: undefined,
          lockedBodyColor: undefined,
          lockedLegsColor: undefined,
        };
      }
      // Use the user's current Set Color pick as the locked value (falling
      // back to head color if they never touched the dropdown).
      const shared = setColor !== DEFAULT_COLOR ? setColor : outfit.headColor;
      return {
        ...l,
        headColor: true,
        bodyColor: true,
        legsColor: true,
        lockedHeadColor: shared,
        lockedBodyColor: shared,
        lockedLegsColor: shared,
      };
    });
  }, [outfit, setColor]);

  /** Apply a single color to every dyeable armor slot; non-dyeable slots keep
   *  their [Default] color. Also records the user's pick as the active "set
   *  color" so the dropdown reflects their choice regardless of whether every
   *  piece could accept it. */
  const setAllColors = useCallback((c: string) => {
    setSetColor(c);
    setOutfit((o) => ({
      ...o,
      headColor: hasColors(o.head) ? c : o.headColor,
      bodyColor: hasColors(o.body) ? c : o.bodyColor,
      legsColor: hasColors(o.legs) ? c : o.legsColor,
    }));
  }, []);

  const setHead = useCallback((name: string) => {
    setOutfit((o) => {
      const headColor = hasColors(name) ? o.headColor : DEFAULT_COLOR;
      return { ...o, head: name, headColor };
    });
    setCurrentSet(CUSTOM_SET);
  }, []);
  const setBody = useCallback((name: string) => {
    setOutfit((o) => {
      const bodyColor = hasColors(name) ? o.bodyColor : DEFAULT_COLOR;
      return { ...o, body: name, bodyColor };
    });
    setCurrentSet(CUSTOM_SET);
  }, []);
  const setLegs = useCallback((name: string) => {
    setOutfit((o) => {
      const legsColor = hasColors(name) ? o.legsColor : DEFAULT_COLOR;
      return { ...o, legs: name, legsColor };
    });
    setCurrentSet(CUSTOM_SET);
  }, []);
  const setWeapon = useCallback((name: string) => {
    setOutfit((o) => ({ ...o, weapon: name }));
  }, []);
  const setShield = useCallback((name: string) => {
    setOutfit((o) => ({ ...o, shield: name }));
  }, []);
  const setBow = useCallback((name: string) => {
    setOutfit((o) => ({ ...o, bow: name }));
  }, []);
  const setHeadColor = useCallback((c: string) => {
    setOutfit((o) => ({ ...o, headColor: c }));
  }, []);
  const setBodyColor = useCallback((c: string) => {
    setOutfit((o) => ({ ...o, bodyColor: c }));
  }, []);
  const setLegsColor = useCallback((c: string) => {
    setOutfit((o) => ({ ...o, legsColor: c }));
  }, []);

  const applySet = useCallback((setName: string) => {
    setCurrentSet(setName);
    if (setName === NONE) {
      setOutfit((o) => ({
        ...o,
        head: NONE,
        body: NONE,
        legs: NONE,
        headColor: DEFAULT_COLOR,
        bodyColor: DEFAULT_COLOR,
        legsColor: DEFAULT_COLOR,
      }));
      return;
    }
    if (setName === CUSTOM_SET) return;
    const pieces = getSetPieces(setName);
    if (!pieces) return;
    setOutfit((o) => ({
      ...o,
      head: pieces.head,
      body: pieces.body,
      legs: pieces.legs,
      // Reset colors to default when applying a set (matches the original's
      // implicit behaviour — the set pieces are rarely dyeable anyway).
      headColor: hasColors(pieces.head) ? o.headColor : DEFAULT_COLOR,
      bodyColor: hasColors(pieces.body) ? o.bodyColor : DEFAULT_COLOR,
      legsColor: hasColors(pieces.legs) ? o.legsColor : DEFAULT_COLOR,
    }));
  }, []);

  const randomize = useCallback(() => {
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const pickItem = (list: string[]) => {
      const pool = list.filter((x) => x !== NONE);
      return pool.length ? pick(pool) : NONE;
    };
    const pickColor = () => pick(COLORS.filter((c) => c !== DEFAULT_COLOR));

    setOutfit((o) => {
      const next = { ...o };
      if (!locks.head) next.head = pickItem(options.heads);
      if (!locks.body) next.body = pickItem(options.bodies);
      if (!locks.legs) next.legs = pickItem(options.legs);

      // Per-slot color with lock precedence. A color lock carries a fixed
      // value, captured when the lock was engaged.
      const chooseColor = (
        item: string,
        lockFlag: boolean,
        lockedValue: string | undefined,
      ): string => {
        if (!hasColors(item)) return DEFAULT_COLOR;
        if (lockFlag && lockedValue) return lockedValue;
        return pickColor();
      };
      next.headColor = chooseColor(next.head, locks.headColor, locks.lockedHeadColor);
      next.bodyColor = chooseColor(next.body, locks.bodyColor, locks.lockedBodyColor);
      next.legsColor = chooseColor(next.legs, locks.legsColor, locks.lockedLegsColor);

      if (!locks.weapon) next.weapon = pickItem(options.weapons);
      if (!locks.shield) next.shield = pickItem(options.shields);
      if (!locks.bow) next.bow = pickItem(options.bows);

      return next;
    });
    // If any armor slot was free to change, we may have rolled a non-matching
    // combination — mark the set as custom. Otherwise preserve the set name.
    if (!locks.head || !locks.body || !locks.legs) {
      setCurrentSet(CUSTOM_SET);
    }
    // Reset the Set Color dropdown: if the lock pinned a color, keep it;
    // otherwise the random per-slot colors mean no single "set color" applies.
    if (locks.headColor && locks.bodyColor && locks.legsColor && locks.lockedHeadColor) {
      setSetColor(locks.lockedHeadColor);
    } else {
      setSetColor(DEFAULT_COLOR);
    }
  }, [locks, options]);

  return {
    outfit,
    locks,
    filters,
    options,
    currentSet,
    setColor,
    isFullSetLocked,
    isSetColorLocked,
    setFilters,
    toggleLock,
    toggleFullSetLock,
    toggleSetColorLock,
    setHead,
    setBody,
    setLegs,
    setWeapon,
    setShield,
    setBow,
    setHeadColor,
    setBodyColor,
    setLegsColor,
    setAllColors,
    applySet,
    randomize,
  };
}
