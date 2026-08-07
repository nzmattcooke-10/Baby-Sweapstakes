"use client";

import { useState } from "react";
import { saveLength } from "@/app/guess/actions";
import { BabySvg } from "@/components/baby/BabySvg";
import {
  BABY_VIEWBOX,
  LENGTH_DEFAULT_MM,
  LENGTH_MAX_MM,
  LENGTH_MIN_MM,
  LENGTH_STEP_MM,
  babyExtent,
} from "@/components/baby/morph";
import { lengthRemark } from "@/lib/commentary";
import { formatLengthBoth, speakLength } from "@/lib/units";
import { SaveBar } from "./SaveBar";
import { ToyShell } from "./ToyShell";

/**
 * A newborn is measured on an infantometer: head against a fixed board, a
 * sliding board brought up to the heels. That's exactly what this is.
 *
 * Both clamps are positioned from the baby's real drawn extent rather than
 * guessed percentages, so the heel board actually touches the feet at every
 * point on the slider instead of drifting off them at the extremes.
 */
export function ClampPanel({
  initial,
  weightGrams,
}: {
  initial: number | null;
  weightGrams: number;
}) {
  const [mm, setMm] = useState(initial ?? LENGTH_DEFAULT_MM);

  const { crown, heel } = babyExtent(weightGrams, mm);
  const toPercent = (unit: number) => (unit / BABY_VIEWBOX.height) * 100;

  return (
    <div className="flex flex-col gap-8">
      <ToyShell
        label="Length"
        value={mm}
        onChange={setMm}
        min={LENGTH_MIN_MM}
        max={LENGTH_MAX_MM}
        step={LENGTH_STEP_MM}
        display={formatLengthBoth(mm)}
        spoken={speakLength(mm)}
        toInput={(v) => (v / 10).toFixed(1)}
        fromInput={(raw) => {
          const cm = Number.parseFloat(raw.replace(",", "."));
          return Number.isFinite(cm) ? Math.round(cm * 10) : null;
        }}
        inputUnit="cm"
        remark={lengthRemark(mm)}
      >
        <div className="mx-auto w-full max-w-[380px]">
          <div className="plate relative px-2 pt-4 pb-5">
            <div className="relative">
              <BabySvg
                weightGrams={weightGrams}
                lengthMm={mm}
                armPose="tucked"
                lying
                width="100%"
              />

              {/* fixed head board */}
              <div
                className="absolute top-0 bottom-0 w-[7px] -translate-x-full rounded-l bg-[#FF6BAE] border-[2px] border-[#111]"
                style={{ left: `${toPercent(crown)}%` }}
              />
              {/* sliding heel board */}
              <div
                className="absolute top-0 bottom-0 w-[7px] rounded-r bg-[#FF6BAE] border-[2px] border-[#111]"
                style={{ left: `${toPercent(heel)}%` }}
              />
            </div>

            {/* ruler */}
            <div className="mt-1 flex h-4 items-start justify-between">
              {Array.from({ length: 25 }, (_, i) => (
                <span
                  key={i}
                  className="w-[2px] origin-bottom"
                  style={{
                    height: i % 4 === 0 ? 12 : 6,
                    background: "#111",
                    // Ruled by hand: no two ticks quite parallel.
                    transform: `rotate(${((i * 37) % 7) - 3}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </ToyShell>

      <SaveBar onSave={() => saveLength(mm)} />
    </div>
  );
}
