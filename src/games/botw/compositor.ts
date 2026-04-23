/**
 * Pure function: outfit → ordered list of image layers.
 *
 * Z-indexes (back → front) exactly match the original Java init() assignments
 * (derived from LocalVariableTable + bytecode z-index literals):
 *
 *   0 background
 *   1 shield           (on Link's back — behind everything else)
 *   2 weapon           (on Link's back)
 *   3 bow              (on Link's back)
 *   4 quiver           (on Link's back, for regular bows only)
 *   5 head cape        (hood drape; earring chains that hang *behind* body)
 *   6 body cape        (Phantom Ganon full cape, Royal Guard cape)
 *   7 legs             (either normal pants or -Belt variant when putOnBelt)
 *   8 body
 *   9 head             (moves to 11 for phantom-ganon-head-above-shoulder)
 *  10 shoulder         (moves to 11 for phantom-elevated case)
 *  10 Salvager adjustment (vest + trousers combined overlay)
 *
 * Special-case rules:
 *   - bunched Hylian Hood / Ravio's Hood when certain bodies are worn
 *   - "putOnBelt" short-top bodies (Old Shirt, Nintendo Switch Shirt) swap
 *     the legs image to its `-Belt` variant so the belt shows above the body
 *   - Phantom Ganon Armor cape layer suppressed by certain head pieces
 *   - Phantom Ganon head/shoulder z swap
 *   - Royal Guard Uniform cape
 *   - Bow quiver suppressed for Bow of Light / Twilight Bow
 *   - Head default-cape sublayer for helms with chain/feather details
 */

import type { Layer, Outfit } from "../../engine/types";
import { NONE } from "../../engine/types";
import { armorFilename, armorUrl, equipmentUrl, toFilenameSlug } from "./images";
import backgroundDyeShop from "./images/armor/background-dye-shop.png?url";
import emptyImg from "./images/armor/empty.png?url";
import headNoneDefault from "./images/armor/head-none-default.png?url";
import headNoneDefaultCape from "./images/armor/head-none-default-Cape.png?url";
import noneBody from "./images/armor/none-body.png?url";
import nonePants from "./images/armor/none-pants.png?url";
import nonePantsBelt from "./images/armor/none-pants-Belt.png?url";
import salvagerAdjustment from "./images/armor/Salvager-Set-Adjustment.png?url";
import quiverImg from "./images/equipment/quiver.png?url";
import {
  BUNCHED_HOOD_BODIES,
  DEFAULT_CAPE_HEADS,
  NON_DYEABLE,
  PHANTOM_GANON_HEAD_ABOVE_SHOULDER,
  PHANTOM_GANON_NO_CAPE_HEADS,
  PUT_ON_BELT,
  RAVIO_NOT_BUNCHED_BODIES,
} from "./data/tables";

export { emptyImg, backgroundDyeShop };

export function hasColors(item: string): boolean {
  return !NON_DYEABLE.has(item) && item !== NONE;
}

function putOnBelt(body: string): boolean {
  return PUT_ON_BELT.has(body);
}

function bunchedHood(body: string): boolean {
  return BUNCHED_HOOD_BODIES.has(body);
}

function bunchedRavio(body: string): boolean {
  return !RAVIO_NOT_BUNCHED_BODIES.has(body);
}

function phantomGanonCape(head: string): boolean {
  return !PHANTOM_GANON_NO_CAPE_HEADS.has(head);
}

function phantomGanonHeadAboveShoulder(head: string): boolean {
  return PHANTOM_GANON_HEAD_ABOVE_SHOULDER.has(head);
}

function hasDefaultCape(head: string): boolean {
  return DEFAULT_CAPE_HEADS.has(head);
}

function armor(
  item: string,
  color: string,
  sublayer?: "Belt" | "Cape" | "Shoulder",
  bunched?: boolean,
) {
  return armorUrl(armorFilename(item, color, sublayer, bunched));
}

export function buildLayers(outfit: Outfit): Layer[] {
  const layers: Layer[] = [];
  const add = (key: string, src: string | undefined, z: number) => {
    if (src) layers.push({ key, src, z });
  };

  add("background", backgroundDyeShop, 0);

  // --- Weapons on Link's back ---
  add("shield", weaponIconUrl(outfit.shield), 1);
  add("weapon", weaponIconUrl(outfit.weapon), 2);
  add("bow", weaponIconUrl(outfit.bow), 3);
  if (
    outfit.bow !== NONE &&
    outfit.bow !== "Bow of Light" &&
    outfit.bow !== "Twilight Bow"
  ) {
    add("quiver", quiverImg, 4);
  }

  // --- Head cape (z 5, behind body) ---
  if (outfit.head === NONE) {
    add("head-cape", headNoneDefaultCape, 5);
  } else {
    const bunched =
      (outfit.head === "Hylian Hood" && bunchedHood(outfit.body)) ||
      (outfit.head === "Ravio's Hood" && bunchedRavio(outfit.body));
    const capeSrc = armor(outfit.head, outfit.headColor, "Cape", bunched);
    if (capeSrc && (hasDefaultCape(outfit.head) || bunched)) {
      add("head-cape", capeSrc, 5);
    }
  }

  // --- Body cape (z 6) ---
  if (outfit.body === "Phantom Ganon Armor" && phantomGanonCape(outfit.head)) {
    add("body-cape", armor("Phantom Ganon Armor", "[Default]", "Cape"), 6);
  } else if (outfit.body === "Royal Guard Uniform") {
    add("body-cape", armor("Royal Guard Uniform", "[Default]", "Cape"), 6);
  }

  // --- Legs (z 7) — source swaps to -Belt variant for short-top bodies ---
  const useBelt = putOnBelt(outfit.body);
  if (outfit.legs === NONE) {
    add("legs", useBelt ? nonePantsBelt : nonePants, 7);
  } else {
    const belted = useBelt ? armor(outfit.legs, outfit.legsColor, "Belt") : undefined;
    const plain = armor(outfit.legs, outfit.legsColor);
    add("legs", belted ?? plain, 7);
  }

  // --- Body (z 8) ---
  if (outfit.body === NONE) {
    add("body", noneBody, 8);
  } else {
    add("body", armor(outfit.body, outfit.bodyColor), 8);
  }

  // --- Head and shoulder (z 9/10/11 depending on Phantom Ganon rules) ---
  // Default: head z 9, shoulder z 10.
  // Phantom Ganon Armor + "head above shoulder" head → head z 11.
  // Phantom Ganon Armor + any other head → shoulder z 11.
  let headZ = 9;
  let shoulderZ = 10;
  if (outfit.body === "Phantom Ganon Armor") {
    if (phantomGanonHeadAboveShoulder(outfit.head)) headZ = 11;
    else shoulderZ = 11;
  }

  if (outfit.head === NONE) {
    add("head", headNoneDefault, headZ);
  } else {
    const bunched =
      (outfit.head === "Hylian Hood" && bunchedHood(outfit.body)) ||
      (outfit.head === "Ravio's Hood" && bunchedRavio(outfit.body));
    add("head", armor(outfit.head, outfit.headColor, undefined, bunched), headZ);
  }

  if (outfit.body !== NONE) {
    const shoulderSrc = armor(outfit.body, outfit.bodyColor, "Shoulder");
    if (shoulderSrc) add("body-shoulder", shoulderSrc, shoulderZ);
  }

  // --- Salvager set adjustment (z 10, alongside shoulder) ---
  if (outfit.body === "Salvager Vest" && outfit.legs === "Salvager Trousers") {
    add("salvager-adjustment", salvagerAdjustment, 10);
  }

  return layers;
}

/** Weapon/shield/bow icon paths — full 382×650 canvas overlays, not thumbs. */
export function weaponIconUrl(name: string): string | undefined {
  if (name === NONE) return undefined;
  return equipmentUrl(`${toFilenameSlug(name)}.png`);
}
