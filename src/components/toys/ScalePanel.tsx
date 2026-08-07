"use client";

import { useState } from "react";
import { saveWeight } from "@/app/guess/actions";
import { BabySvg } from "@/components/baby/BabySvg";
import {
  WEIGHT_DEFAULT_G,
  WEIGHT_MAX_G,
  WEIGHT_MIN_G,
  WEIGHT_STEP_G,
} from "@/components/baby/morph";
import { weightRemark } from "@/lib/commentary";
import { formatWeightBoth, speakWeight } from "@/lib/units";
import {
  hatchCircle,
  roughCircle,
  roughRoundRect,
} from "@/components/zine/rough";
import { SaveBar } from "./SaveBar";
import { ToyShell } from "./ToyShell";

/** Sweep of the dial needle, in degrees either side of vertical. */
const NEEDLE_SWEEP = 132;

export function ScalePanel({
  initial,
  lengthMm,
}: {
  initial: number | null;
  /** Kept steady so the weight slider visibly changes width, not height. */
  lengthMm: number;
}) {
  const [grams, setGrams] = useState(initial ?? WEIGHT_DEFAULT_G);

  const t = (grams - WEIGHT_MIN_G) / (WEIGHT_MAX_G - WEIGHT_MIN_G);
  const needle = -NEEDLE_SWEEP + t * NEEDLE_SWEEP * 2;

  // The scale is drawn, not assembled from primitives. Seeded on nothing that
  // changes with the slider, so the object holds still while the needle moves.
  const pan = roughRoundRect(52, 0, 216, 16, 8, "scale-pan");
  const body = roughRoundRect(62, 16, 196, 120, 18, "scale-body");
  const dial = roughCircle(160, 92, 40, "scale-dial", { wobble: 0.02 });
  // Kept small and low on the face so it shades the glass without crossing the
  // graduations — hatching over the ticks reads as a smudge, not as volume.
  const dialShade = hatchCircle(176, 110, 15, "scale-dialshade", {
    angle: -0.7,
    gap: 3.6,
  });
  const footL = roughRoundRect(72, 136, 26, 10, 5, "scale-footL");
  const footR = roughRoundRect(222, 136, 26, 10, 5, "scale-footR");

  return (
    <div className="flex flex-col gap-8">
      <ToyShell
        label="Weight"
        value={grams}
        onChange={setGrams}
        min={WEIGHT_MIN_G}
        max={WEIGHT_MAX_G}
        step={WEIGHT_STEP_G}
        display={formatWeightBoth(grams)}
        spoken={speakWeight(grams)}
        toInput={(g) => (g / 1000).toFixed(2)}
        fromInput={(raw) => {
          const kg = Number.parseFloat(raw.replace(",", "."));
          return Number.isFinite(kg) ? Math.round(kg * 1000) : null;
        }}
        inputUnit="kg"
        remark={weightRemark(grams)}
      >
        <div className="plate flex flex-col items-center px-3 pt-4 pb-2">
          <BabySvg
            weightGrams={grams}
            lengthMm={lengthMm}
            width={168}
            // Pulls the feet down onto the pan; the SVG carries blank space
            // below the baby so the figure can grow without reflowing.
            className="relative z-10 -mb-7"
          />
          <svg viewBox="0 0 320 150" className="w-full max-w-[340px]">
            {/* pan */}
            <path d={pan} fill="#FFE34D" stroke="#111" strokeWidth="2.6" strokeLinejoin="round" />

            {/* body of the scale */}
            <path d={body} fill="#FFFDF7" stroke="#111" strokeWidth="2.6" strokeLinejoin="round" />
            <path
              d="M64 45 C110 42 178 48 256 43"
              stroke="#111"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* dial face */}
            <path d={dial} fill="#FFF8EC" />
            <g stroke="#111" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.28">
              {dialShade.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <path d={dial} fill="none" stroke="#111" strokeWidth="2.8" strokeLinecap="round" />
            {Array.from({ length: 11 }, (_, i) => {
              const a = (-NEEDLE_SWEEP + (i / 10) * NEEDLE_SWEEP * 2) * (Math.PI / 180);
              const inner = i % 5 === 0 ? 27 : 31;
              return (
                <line
                  key={i}
                  x1={160 + Math.sin(a) * inner}
                  y1={92 - Math.cos(a) * inner}
                  x2={160 + Math.sin(a) * 35}
                  y2={92 - Math.cos(a) * 35}
                  stroke="#111"
                  strokeWidth={i % 5 === 0 ? 2.5 : 1.4}
                />
              );
            })}

            <g transform={`rotate(${needle} 160 92)`}>
              <line x1="160" y1="92" x2="160" y2="60" stroke="#111" strokeWidth="4" strokeLinecap="round" />
            </g>
            <path d={roughCircle(160, 92, 5.5, "scale-hub", { wobble: 0.1, samples: 9 })} fill="#FF6BAE" stroke="#111" strokeWidth="2.2" />

            {/* feet */}
            <path d={footL} fill="#FFFDF7" stroke="#111" strokeWidth="2.4" strokeLinejoin="round" />
            <path d={footR} fill="#FFFDF7" stroke="#111" strokeWidth="2.4" strokeLinejoin="round" />
          </svg>
        </div>
      </ToyShell>

      <SaveBar onSave={() => saveWeight(grams)} />
    </div>
  );
}
