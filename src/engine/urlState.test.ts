import { describe, expect, it } from "vitest";
import {
  buildUrlTable,
  decodeOutfit,
  encodeOutfit,
  formatHash,
  parseHash,
} from "./urlState";
import type { GameUrlTables } from "./urlState";
import {
  URL_BODY,
  URL_BOW,
  URL_COLOR,
  URL_HEAD,
  URL_LEGS,
  URL_SHIELD,
  URL_WEAPON,
} from "../games/botw/data/tables";

const T: GameUrlTables = {
  color: buildUrlTable(URL_COLOR),
  head: buildUrlTable(URL_HEAD),
  body: buildUrlTable(URL_BODY),
  legs: buildUrlTable(URL_LEGS),
  weapon: buildUrlTable(URL_WEAPON),
  shield: buildUrlTable(URL_SHIELD),
  bow: buildUrlTable(URL_BOW),
};

describe("BotW URL fragment", () => {
  it("all-defaults produces a 10-char all-zeros fragment", () => {
    const code = encodeOutfit(
      {
        head: "[None]",
        headColor: "[Default]",
        body: "[None]",
        bodyColor: "[Default]",
        legs: "[None]",
        legsColor: "[Default]",
        weapon: "[None]",
        shield: "[None]",
        bow: "[None]",
      },
      T,
    );
    expect(code).toBe("0000000000");
  });

  it("round-trips a specific outfit", () => {
    const outfit = {
      head: "Ancient Helm",
      headColor: "Blue",
      body: "Ancient Cuirass",
      bodyColor: "Red",
      legs: "Ancient Greaves",
      legsColor: "Yellow",
      weapon: "Master Sword",
      shield: "Hylian Shield",
      bow: "Bow of Light",
    };
    const code = encodeOutfit(outfit, T);
    expect(code).toHaveLength(10);
    expect(decodeOutfit(code, T)).toEqual(outfit);
  });

  it("round-trips every armor piece individually", () => {
    // Exhaustive: every URL code encodes and decodes back to the same name.
    for (const [name] of URL_HEAD) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, head: name }, T);
      expect(decodeOutfit(code, T).head).toBe(name);
    }
    for (const [name] of URL_BODY) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, body: name }, T);
      expect(decodeOutfit(code, T).body).toBe(name);
    }
    for (const [name] of URL_LEGS) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, legs: name }, T);
      expect(decodeOutfit(code, T).legs).toBe(name);
    }
    for (const [name] of URL_WEAPON) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, weapon: name }, T);
      expect(decodeOutfit(code, T).weapon).toBe(name);
    }
    for (const [name] of URL_SHIELD) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, shield: name }, T);
      expect(decodeOutfit(code, T).shield).toBe(name);
    }
    for (const [name] of URL_BOW) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, bow: name }, T);
      expect(decodeOutfit(code, T).bow).toBe(name);
    }
    for (const [name] of URL_COLOR) {
      const decoded = decodeOutfit("0".repeat(10), T);
      const code = encodeOutfit({ ...decoded, headColor: name }, T);
      expect(decodeOutfit(code, T).headColor).toBe(name);
    }
  });

  it("pads short fragments with zeros", () => {
    const o = decodeOutfit("", T);
    expect(o.head).toBe("[None]");
    expect(o.headColor).toBe("[Default]");
  });

  it("unknown codes fall back to [None] / [Default]", () => {
    const o = decodeOutfit("~~~~~~~~~~", T);
    expect(o.head).toBe("[None]");
    expect(o.headColor).toBe("[Default]");
    expect(o.weapon).toBe("[None]");
  });
});

describe("hash parsing", () => {
  it("parses bare legacy fragments as BotW", () => {
    expect(parseHash("#abc")).toEqual({ game: "botw", body: "abc" });
    expect(parseHash("#0000000000")).toEqual({
      game: "botw",
      body: "0000000000",
    });
  });

  it("parses namespaced fragments", () => {
    expect(parseHash("#botw-abc")).toEqual({ game: "botw", body: "abc" });
    expect(parseHash("#totk-abc")).toEqual({ game: "totk", body: "abc" });
  });

  it("parses empty-body game prefix", () => {
    expect(parseHash("#totk")).toEqual({ game: "totk", body: "" });
  });

  it("is case-insensitive for game prefix", () => {
    expect(parseHash("#BOTW-xyz")).toEqual({ game: "botw", body: "xyz" });
  });

  it("formats hashes with the game prefix", () => {
    expect(formatHash("botw", "0000000000")).toBe("#botw-0000000000");
    expect(formatHash("totk", "")).toBe("#totk-");
  });
});
