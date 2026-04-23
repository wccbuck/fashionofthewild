import { forwardRef, useEffect, useRef, useState } from "react";
import type { Layer } from "../engine/types";

const DESIGN_W = 422;
const DESIGN_H = 690;

interface Props {
  layers: Layer[];
  labels?: { value: string; topPx: number; side: "left" | "right" }[];
}

export const OutfitPreview = forwardRef<HTMLDivElement, Props>(
  function OutfitPreview({ layers, labels }, ref) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      const update = () => {
        const w = el.getBoundingClientRect().width;
        setScale(Math.min(1, w / DESIGN_W));
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={wrapperRef}
        className="relative mx-auto w-full"
        style={{ maxWidth: DESIGN_W, aspectRatio: `${DESIGN_W} / ${DESIGN_H}` }}
      >
        <div
          ref={ref}
          className="absolute top-0 left-0"
          style={{
            width: DESIGN_W,
            height: DESIGN_H,
            transformOrigin: "top left",
            transform: `scale(${scale})`,
          }}
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
      </div>
    );
  },
);
