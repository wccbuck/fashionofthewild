/**
 * Vite glob-imports for every BotW image. Keys are filenames (e.g.
 * "Ancient-Cuirass-Blue-Shoulder.png"); values are hashed URLs.
 *
 * Consumers build a filename from an item name + color + sublayer and look
 * it up here. Unknown keys return `undefined` so the caller can skip that
 * layer (e.g. items that don't have a -Shoulder variant).
 */

const armorModules = import.meta.glob("./images/armor/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const equipmentModules = import.meta.glob("./images/equipment/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function keyOf(path: string): string {
  // "./images/armor/Foo-Bar.png" → "Foo-Bar.png"
  return path.slice(path.lastIndexOf("/") + 1);
}

const armor = new Map<string, string>();
for (const [path, url] of Object.entries(armorModules)) {
  armor.set(keyOf(path), url);
}

const equipment = new Map<string, string>();
for (const [path, url] of Object.entries(equipmentModules)) {
  equipment.set(keyOf(path), url);
}

/** Lookup an armor image by filename. Returns `undefined` if missing. */
export function armorUrl(filename: string): string | undefined {
  return armor.get(filename);
}

/** Lookup a weapon/shield/bow icon by filename. */
export function equipmentUrl(filename: string): string | undefined {
  return equipment.get(filename);
}

/** Turn a display name like "Amber Earrings" into its filename-friendly form
 *  "Amber-Earrings". Apostrophes are preserved (matches the original files). */
export function toFilenameSlug(name: string): string {
  return name.replace(/ /g, "-");
}

/** Build an armor PNG filename for a given piece/color/sublayer. The color
 *  must also be slugged because "Light Blue" is stored as "Light-Blue.png". */
export function armorFilename(
  item: string,
  color: string,
  sublayer?: "Belt" | "Cape" | "Shoulder",
  bunched?: boolean,
): string {
  const piece = bunched ? `${item} Bunched` : item;
  const base = `${toFilenameSlug(piece)}-${toFilenameSlug(color)}`;
  return sublayer ? `${base}-${sublayer}.png` : `${base}.png`;
}
