import { forwardRef } from "react";
import type { Layer } from "../engine/types";

interface Props {
  layers: Layer[];
  labels?: { value: string; topPx: number; side: "left" | "right" }[];
}

export const OutfitPreview = forwardRef<HTMLDivElement, Props>(
  function OutfitPreview({ layers, labels }, ref) {
    return (
      <div
        ref={ref}
        className="relative mx-auto"
        style={{ width: 422, height: 690 }}
      >
        {layers
          .slice()
          .sort((a, b) => a.z - b.z)
          .map((l) => (
            <img
              key={l.key}
              src={l.src}
              alt=""
              className="absolute pointer-events-none"
              style={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
                zIndex: l.z,
              }}
            />
          ))}
        {labels?.map((l, i) => (
          <div
            key={i}
            className="absolute text-white text-sm drop-shadow-[2px_2px_1px_rgba(0,0,0,0.8)]"
            style={{
              [l.side]: 25,
              top: l.topPx,
              zIndex: 20,
            }}
          >
            {l.value}
          </div>
        ))}
        <div
          className="absolute italic text-white text-sm drop-shadow-[2px_2px_1px_rgba(0,0,0,0.8)]"
          style={{ left: 25, bottom: 20, zIndex: 20 }}
        >
          fashionofthewild.com
        </div>
      </div>
    );
  },
);
