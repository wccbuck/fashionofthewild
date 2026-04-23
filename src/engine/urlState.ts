/**
 * URL fragment encoding, matches the legacy Java implementation so
 * that old shared URLs from fashionofthewild.com still work.
 *
 * Fragment layout (10 chars, no separators):
 *   0: head code
 *   1: head color code
 *   2: body code
 *   3: body color code
 *   4: legs code
 *   5: legs color code
 *   6-7: weapon code (see note below)
 *   8: shield code
 *   9: bow code
 *
 * Weapon encoding quirk from the original fotw .war:
 *   weaponToChar(name) returned `row.c2 + row.c1`, so fragment positions [6,7]
 *   are written as c2 then c1. This app's URL_WEAPON table pre-flips this so each
 *   entry stores [name, c2+c1] directly, matching what appears in the fragment.
 *
 * Short fragments are padded with '0' on the right until length >= 10, and
 * unknown codes resolve to the "None"/"Default" value for that slot.
 */

import type { GameId, Outfit, UrlTable } from "./types";
import { DEFAULT_COLOR, NONE } from "./types";

export function buildUrlTable(rows: ReadonlyArray<readonly [string, string]>): UrlTable {
  const toCode = new Map<string, string>();
  const fromCode = new Map<string, string>();
  for (const [name, code] of rows) {
    toCode.set(name, code);
    fromCode.set(code, name);
  }
  return { toCode, fromCode };
}

export interface GameUrlTables {
  color: UrlTable;
  head: UrlTable;
  body: UrlTable;
  legs: UrlTable;
  weapon: UrlTable;
  shield: UrlTable;
  bow: UrlTable;
}

/** Encode an outfit to its 10-char fragment body (no leading `#` or prefix). */
export function encodeOutfit(o: Outfit, t: GameUrlTables): string {
  return (
    (t.head.toCode.get(o.head) ?? "0") +
    (t.color.toCode.get(o.headColor) ?? "0") +
    (t.body.toCode.get(o.body) ?? "0") +
    (t.color.toCode.get(o.bodyColor) ?? "0") +
    (t.legs.toCode.get(o.legs) ?? "0") +
    (t.color.toCode.get(o.legsColor) ?? "0") +
    (t.weapon.toCode.get(o.weapon) ?? "00") +
    (t.shield.toCode.get(o.shield) ?? "0") +
    (t.bow.toCode.get(o.bow) ?? "0")
  );
}

/** Parse a 10-char fragment body into an outfit. Short fragments are padded
 * with '0'. Unknown codes fall back to [None] / [Default]. */
export function decodeOutfit(raw: string, t: GameUrlTables): Outfit {
  const s = (raw + "0000000000").slice(0, 10);
  const get = (table: UrlTable, code: string, fallback: string) =>
    table.fromCode.get(code) ?? fallback;
  return {
    head: get(t.head, s[0], NONE),
    headColor: get(t.color, s[1], DEFAULT_COLOR),
    body: get(t.body, s[2], NONE),
    bodyColor: get(t.color, s[3], DEFAULT_COLOR),
    legs: get(t.legs, s[4], NONE),
    legsColor: get(t.color, s[5], DEFAULT_COLOR),
    weapon: get(t.weapon, s[6] + s[7], NONE),
    shield: get(t.shield, s[8], NONE),
    bow: get(t.bow, s[9], NONE),
  };
}

export interface ParsedHash {
  game: GameId;
  body: string; // the 10-char portion
}

/**
 * Parse a location hash, handling legacy (bare) and new (namespaced) forms.
 *
 *   #0000000000           → { game: "botw", body: "0000000000" }
 *   #botw-0000000000      → { game: "botw", body: "0000000000" }
 *   #totk-0000000000      → { game: "totk", body: "0000000000" }
 *   #totk                 → { game: "totk", body: "" }
 *   #                     → { game: "botw", body: "" }
 *
 * The prefix is case-insensitive.
 */
export function parseHash(hash: string): ParsedHash {
  const h = hash.replace(/^#/, "");
  const m = /^(botw|totk)(?:-(.*))?$/i.exec(h);
  if (m) {
    return { game: m[1].toLowerCase() as GameId, body: m[2] ?? "" };
  }
  // old links direct to BotW
  return { game: "botw", body: h };
}

export function formatHash(game: GameId, body: string): string {
  return `#${game}-${body}`;
}
