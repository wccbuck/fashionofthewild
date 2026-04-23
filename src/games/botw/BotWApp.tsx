import { useMemo, useRef, useState } from "react";
import { OutfitPreview } from "../../components/OutfitPreview";
import { SlotSelect } from "../../components/SlotSelect";
import { useBotWOutfit } from "./useBotWOutfit";
import { buildLayers, hasColors } from "./compositor";
import { getSetNames } from "./game";

type LabelPos = "Left" | "Right" | "Hidden";

export function BotWApp({ isActive }: { isActive: boolean }) {
  const s = useBotWOutfit({ isActive });
  const layers = useMemo(() => buildLayers(s.outfit), [s.outfit]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [labelPos, setLabelPos] = useState<LabelPos>("Right");
  const [showAbout, setShowAbout] = useState(false);

  const setNames = useMemo(() => getSetNames(s.filters), [s.filters]);

  const details = useMemo(() => {
    if (labelPos === "Hidden") return undefined;
    const side = labelPos === "Left" ? ("left" as const) : ("right" as const);
    const entries: { value: string; topPx: number; side: "left" | "right" }[] = [];
    const withColor = (item: string, color: string) =>
      item === "[None]" ? null : color === "[Default]" ? item : `${item}, ${color}`;
    const lineHeight = 20;
    let y = 25;
    const push = (value: string | null) => {
      if (value) {
        entries.push({ value, topPx: y, side });
        y += lineHeight;
      }
    };
    push(withColor(s.outfit.head, s.outfit.headColor));
    push(withColor(s.outfit.body, s.outfit.bodyColor));
    push(withColor(s.outfit.legs, s.outfit.legsColor));
    push(s.outfit.weapon === "[None]" ? null : s.outfit.weapon);
    push(s.outfit.shield === "[None]" ? null : s.outfit.shield);
    push(s.outfit.bow === "[None]" ? null : s.outfit.bow);
    return entries;
  }, [s.outfit, labelPos]);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(previewRef.current, {
      pixelRatio: 2,
      width: 422,
      height: 690,
      style: { transform: "scale(1)", transformOrigin: "top left" },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "fashion-of-the-wild.png";
    a.click();
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-6 p-4 lg:p-6 max-w-[1400px] mx-auto">
      <div className="w-full lg:w-[422px] flex-shrink-0 flex flex-col items-center gap-3">
        <OutfitPreview ref={previewRef} layers={layers} labels={details} />

        <div className="flex gap-2 flex-wrap justify-center">
          <button
            onClick={s.randomize}
            className="px-5 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 shadow"
          >
            Randomize!
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-md bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-100 hover:bg-stone-300 dark:hover:bg-slate-600"
          >
            Save This Outfit
          </button>
          <button
            onClick={() => setShowAbout(true)}
            className="px-4 py-2 rounded-md bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-100 hover:bg-stone-300 dark:hover:bg-slate-600"
          >
            About
          </button>
        </div>

        <fieldset className="flex items-center gap-3 text-sm text-stone-600 dark:text-slate-400 mt-2">
          <legend className="sr-only">Outfit details position</legend>
          <span>Outfit Details:</span>
          {(["Left", "Right", "Hidden"] as LabelPos[]).map((pos) => (
            <label key={pos} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="labelpos"
                checked={labelPos === pos}
                onChange={() => setLabelPos(pos)}
              />
              {pos}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
        <SlotSelect
          label="Full Set"
          value={s.currentSet}
          options={setNames}
          onChange={s.applySet}
          locked={s.isFullSetLocked}
          onToggleLock={s.toggleFullSetLock}
        />
        <SlotSelect
          label="Set Color"
          value={s.setColor}
          options={s.options.colors}
          onChange={s.setAllColors}
          locked={s.isSetColorLocked}
          onToggleLock={s.toggleSetColorLock}
        />

        <SlotSelect
          label="Head"
          value={s.outfit.head}
          options={s.options.heads}
          onChange={s.setHead}
          locked={s.locks.head}
          onToggleLock={() => s.toggleLock("head")}
        />
        <SlotSelect
          label="Head Color"
          value={s.outfit.headColor}
          options={s.options.colors}
          onChange={s.setHeadColor}
          locked={s.locks.headColor}
          onToggleLock={() => s.toggleLock("headColor")}
          disabled={!isDyeable(s.outfit.head)}
        />

        <SlotSelect
          label="Body"
          value={s.outfit.body}
          options={s.options.bodies}
          onChange={s.setBody}
          locked={s.locks.body}
          onToggleLock={() => s.toggleLock("body")}
        />
        <SlotSelect
          label="Body Color"
          value={s.outfit.bodyColor}
          options={s.options.colors}
          onChange={s.setBodyColor}
          locked={s.locks.bodyColor}
          onToggleLock={() => s.toggleLock("bodyColor")}
          disabled={!isDyeable(s.outfit.body)}
        />

        <SlotSelect
          label="Legs"
          value={s.outfit.legs}
          options={s.options.legs}
          onChange={s.setLegs}
          locked={s.locks.legs}
          onToggleLock={() => s.toggleLock("legs")}
        />
        <SlotSelect
          label="Legs Color"
          value={s.outfit.legsColor}
          options={s.options.colors}
          onChange={s.setLegsColor}
          locked={s.locks.legsColor}
          onToggleLock={() => s.toggleLock("legsColor")}
          disabled={!isDyeable(s.outfit.legs)}
        />

        <div className="col-span-full border-t border-stone-300 dark:border-slate-700 my-2" />

        <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <SlotSelect
            label="Weapon"
            value={s.outfit.weapon}
            options={s.options.weapons}
            onChange={s.setWeapon}
            locked={s.locks.weapon}
            onToggleLock={() => s.toggleLock("weapon")}
          />
          <SlotSelect
            label="Shield"
            value={s.outfit.shield}
            options={s.options.shields}
            onChange={s.setShield}
            locked={s.locks.shield}
            onToggleLock={() => s.toggleLock("shield")}
          />
          <SlotSelect
            label="Bow"
            value={s.outfit.bow}
            options={s.options.bows}
            onChange={s.setBow}
            locked={s.locks.bow}
            onToggleLock={() => s.toggleLock("bow")}
          />
        </div>

        <div className="col-span-full border-t border-stone-300 dark:border-slate-700 my-2" />

        <div className="col-span-full flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={s.filters.amiibo}
              onChange={(e) =>
                s.setFilters({ ...s.filters, amiibo: e.target.checked })
              }
            />
            Include Amiibo Items
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={s.filters.dlc}
              onChange={(e) =>
                s.setFilters({ ...s.filters, dlc: e.target.checked })
              }
            />
            Include DLC Items
          </label>
        </div>
      </div>

      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
    </div>
  );
}

function isDyeable(item: string): boolean {
  return hasColors(item);
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg p-6 text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-zelda text-3xl mb-3">Fashion of the Wild</h2>
        <p className="mb-3">
          Mix and match equipment from <em>The Legend of Zelda: Breath of the
          Wild</em>, create fashionable outfits, and share them with your
          friends! Just copy and paste the URL, including everything after the <code>#</code> symbol,
          to share your creation!
        </p>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Originally created in 2017 by{" "}
          <a
            href="https://github.com/wccbuck"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Will Buck
          </a>
          . Rebuilt in React in 2026. If you'd like to support this and other projects,{" "}
          <a
            href="https://ko-fi.com/wccbuck"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            here's my Ko-fi tip jar
          </a>
          .
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All equipment names and images are copyright Nintendo Co., Ltd.
        </p>
        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
