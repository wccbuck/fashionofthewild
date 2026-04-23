export type ColorName = string;
export type ItemName = string;
export type GameId = "botw" | "totk";

export const SLOT_KEYS = ["head", "body", "legs", "weapon", "shield", "bow"] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export const NONE = "[None]";
export const DEFAULT_COLOR = "[Default]";
export const CUSTOM_SET = "[Custom]";

export interface Item {
  name: ItemName;
  amiibo?: boolean;
  dlc?: boolean;
  set?: string;
}

export interface ArmorSet {
  name: string;
  head: ItemName;
  body: ItemName;
  legs: ItemName;
  amiibo?: boolean;
  dlc?: boolean;
}

export interface Layer {
  /** unique key for React */
  key: string;
  /** image URL (already resolved by Vite) */
  src: string;
  /** CSS z-index */
  z: number;
}

/** Full editable state. No backgrounds — the original never finished them. */
export interface Outfit {
  head: ItemName;
  headColor: ColorName;
  body: ItemName;
  bodyColor: ColorName;
  legs: ItemName;
  legsColor: ColorName;
  weapon: ItemName;
  shield: ItemName;
  bow: ItemName;
}

export type LockKey =
  | "head"
  | "body"
  | "legs"
  | "weapon"
  | "shield"
  | "bow"
  | "set"
  | "headColor"
  | "bodyColor"
  | "legsColor"
  | "setColor";

export interface Locks {
  head: boolean;
  body: boolean;
  legs: boolean;
  weapon: boolean;
  shield: boolean;
  bow: boolean;
  set: boolean;
  headColor: boolean;
  bodyColor: boolean;
  legsColor: boolean;
  setColor: boolean;
  lockedHeadColor?: ColorName;
  lockedBodyColor?: ColorName;
  lockedLegsColor?: ColorName;
  lockedSetColor?: ColorName;
}

export interface Filters {
  amiibo: boolean;
  dlc: boolean;
}

export const DEFAULT_OUTFIT: Outfit = {
  head: NONE,
  headColor: DEFAULT_COLOR,
  body: NONE,
  bodyColor: DEFAULT_COLOR,
  legs: NONE,
  legsColor: DEFAULT_COLOR,
  weapon: NONE,
  shield: NONE,
  bow: NONE,
};

export const DEFAULT_LOCKS: Locks = {
  head: false,
  body: false,
  legs: false,
  weapon: false,
  shield: false,
  bow: false,
  set: false,
  headColor: false,
  bodyColor: false,
  legsColor: false,
  setColor: false,
};

export interface UrlTable {
  /** item name -> URL code (1 or 2 chars) */
  toCode: Map<ItemName, string>;
  /** URL code -> item name */
  fromCode: Map<string, ItemName>;
}

export interface GameDef {
  id: GameId;
  label: string;
  colors: ColorName[]; // DEFAULT_COLOR = index 0
  heads: Item[];
  bodies: Item[];
  legs: Item[];
  weapons: Item[];
  shields: Item[];
  bows: Item[];
  sets: ArmorSet[];
  urlTables: {
    color: UrlTable;
    head: UrlTable;
    body: UrlTable;
    legs: UrlTable;
    weapon: UrlTable;
    shield: UrlTable;
    bow: UrlTable;
  };
  hasColors: (item: ItemName) => boolean; // <- can be dyed
  specialCases: SpecialCases;
  backgroundSrc: string;
  armorImage: (item: ItemName, color: ColorName, sublayer?: string) => string | null;
  equipmentImage: (item: ItemName) => string | null;
  basePaperdoll: {
    headNone: string;
    headNoneCape: string;
    bodyNone: string;
    legsNone: string;
    legsNoneBelt: string;
    quiver: string;
    empty: string;
  };
  extras: Record<string, string>; // amiibo or dlc equipment, user can toggle off
}

export interface SpecialCases {
  bunchedHood: (body: ItemName) => boolean;
  bunchedRavio: (body: ItemName) => boolean;
  putOnBelt: (body: ItemName) => boolean;
  defaultCape: (head: ItemName) => boolean;
  phantomGanonCape: (body: ItemName) => boolean;
  phantomGanonHeadAboveShoulder: (head: ItemName) => boolean;
}
