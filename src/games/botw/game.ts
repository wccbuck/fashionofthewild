/**
 * Single source of truth for BotW equipment lists, armor sets, and URL tables.
 * This file is the thin runtime wrapper around the auto-generated `tables.ts`
 * — derive filtered lists, look up set pieces, etc.
 */

import { buildUrlTable } from "../../engine/urlState";
import type { GameUrlTables } from "../../engine/urlState";
import {
  BODIES,
  BOWS,
  COLORS,
  HEADS,
  LEGS,
  NON_DYEABLE,
  SETS,
  SHIELDS,
  URL_BODY,
  URL_BOW,
  URL_COLOR,
  URL_HEAD,
  URL_LEGS,
  URL_SHIELD,
  URL_WEAPON,
  WEAPONS,
} from "./data/tables";
import type { Filters } from "../../engine/types";
import { CUSTOM_SET, NONE } from "../../engine/types";

export const BOTW_URL_TABLES: GameUrlTables = {
  color: buildUrlTable(URL_COLOR),
  head: buildUrlTable(URL_HEAD),
  body: buildUrlTable(URL_BODY),
  legs: buildUrlTable(URL_LEGS),
  weapon: buildUrlTable(URL_WEAPON),
  shield: buildUrlTable(URL_SHIELD),
  bow: buildUrlTable(URL_BOW),
};

type Item = (typeof HEADS)[number];

function passes(item: Item, f: Filters): boolean {
  if (item.amiibo && !f.amiibo) return false;
  if (item.dlc && !f.dlc) return false;
  return true;
}

const byName = (a: string, b: string) => a.localeCompare(b);

function filterNames(items: readonly Item[], f: Filters): string[] {
  return [NONE, ...items.filter((i) => passes(i, f)).map((i) => i.name).sort(byName)];
}

export function getHeads(f: Filters): string[] { return filterNames(HEADS, f); }
export function getBodies(f: Filters): string[] { return filterNames(BODIES, f); }
export function getLegs(f: Filters): string[] { return filterNames(LEGS, f); }
export function getWeapons(f: Filters): string[] { return filterNames(WEAPONS, f); }
// Shields and bows have no amiibo/dlc filtering in the original data — return all.
export function getShields(_f: Filters): string[] {
  return [NONE, ...SHIELDS.map((i) => i.name).sort(byName)];
}
export function getBows(_f: Filters): string[] {
  return [NONE, ...BOWS.map((i) => i.name).sort(byName)];
}

export function getSetNames(f: Filters): string[] {
  const filtered = SETS.filter((s) => {
    if (s.amiibo && !f.amiibo) return false;
    if (s.dlc && !f.dlc) return false;
    return true;
  }).map((s) => s.name).sort(byName);
  return [NONE, CUSTOM_SET, ...filtered];
}

export function getSetPieces(setName: string): { head: string; body: string; legs: string } | null {
  const s = SETS.find((s) => s.name === setName);
  return s ? { head: s.head, body: s.body, legs: s.legs } : null;
}

/** For a piece, the set it belongs to (if any) — used to compute [Custom]. */
export function setNameFor(head: string, body: string, legs: string): string {
  if (head === NONE && body === NONE && legs === NONE) return NONE;
  const s = SETS.find(
    (s) => s.head === head && s.body === body && s.legs === legs,
  );
  return s ? s.name : CUSTOM_SET;
}

export { COLORS, NON_DYEABLE };
