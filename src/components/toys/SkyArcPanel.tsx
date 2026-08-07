"use client";

import { useState } from "react";
import { saveTime } from "@/app/guess/actions";
import { timeRemark } from "@/lib/commentary";
import { SKY_BAND_LABEL, formatTime, skyBand, speakTime } from "@/lib/units";
import { SaveBar } from "./SaveBar";
import { ToyShell } from "./ToyShell";

/**
 * The sun rides an arc across the sky and the background shifts with it.
 *
 * Snapped to quarter hours: finer precision is fiddly on a phone, and claiming
 * to predict a birth to the minute is faintly absurd anyway.
 */
const STEP_MINUTES = 15;
const DEFAULT_MINUTE = 9 * 60;

/**
 * The sky, printed rather than photographed: two flat inks per band from the
 * zine's own three highlighters plus black. A photographic gradient was the one
 * thing on the old panel that came from a different world than everything
 * around it.
 */
const SKY: Record<string, [string, string]> = {
  night: ["#111111", "#2A2A3D"],
  dawn: ["#3A2140", "#FF6BAE"],
  day: ["#00C7B7", "#CFF7F2"],
  dusk: ["#FF6BAE", "#3A2140"],
};

export function SkyArcPanel({ initial }: { initial: number | null }) {
  const [minute, setMinute] = useState(initial ?? DEFAULT_MINUTE);

  const band = skyBand(minute);
  const [skyTop, skyBottom] = SKY[band];

  // Midnight sits at the left horizon, noon at the top, midnight again at the
  // right — the sun's actual path across a day.
  const t = minute / 1440;
  const theta = Math.PI * t;
  const cx = 160;
  const cy = 132;
  const r = 108;
  const bodyX = cx - Math.cos(theta) * r;
  const bodyY = cy - Math.sin(theta) * r;

  const hour = minute / 60;
  const isSun = hour >= 6 && hour < 18;

  return (
    <div className="flex flex-col gap-8">
      <ToyShell
        label="Time of day"
        value={minute}
        onChange={setMinute}
        min={0}
        max={1440 - STEP_MINUTES}
        step={STEP_MINUTES}
        display={formatTime(minute)}
        spoken={`${speakTime(minute)}, ${SKY_BAND_LABEL[band]}`}
        toInput={(v) => formatTime(v)}
        fromInput={(raw) => {
          // Accepts "9:30", "9.30", "0930", "21:05".
          const match = raw
            .trim()
            .toLowerCase()
            .match(/^(\d{1,2})[:.\s]?(\d{2})?\s*(am|pm)?$/);
          if (!match) return null;
          let h = Number(match[1]);
          const m = Number(match[2] ?? 0);
          const suffix = match[3];
          if (suffix === "pm" && h < 12) h += 12;
          if (suffix === "am" && h === 12) h = 0;
          if (h > 23 || m > 59) return null;
          const total = h * 60 + m;
          return Math.round(total / STEP_MINUTES) * STEP_MINUTES;
        }}
        inputUnit=""
        remark={timeRemark(minute)}
      >
        <div className="plate mx-auto w-full max-w-[380px] overflow-hidden">
          <svg viewBox="0 0 320 160" className="w-full">
            {/* Two flat inks with a hand-drawn join, not a gradient. A smooth
                vertical blend is a photograph of a sky; this page is printed,
                and everything else on it is laid down in flat passes. */}
            <rect width="320" height="160" fill={skyTop} />
            <path
              d="M0 96 C54 88 104 104 160 97 C214 90 266 105 320 95 L320 160 L0 160 Z"
              fill={skyBottom}
            />

            {band === "night" && (
              <g fill="#FFFFFF" opacity="0.85">
                <circle cx="40" cy="30" r="1.6" />
                <circle cx="86" cy="18" r="1.1" />
                <circle cx="132" cy="38" r="1.4" />
                <circle cx="212" cy="24" r="1.2" />
                <circle cx="262" cy="44" r="1.6" />
                <circle cx="292" cy="16" r="1.1" />
              </g>
            )}

            {/* the arc the body travels along */}
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="#FFF8EC"
              strokeOpacity="0.55"
              strokeWidth="2.2"
              strokeDasharray="4 8"
              strokeLinecap="round"
            />

            {isSun ? (
              <g>
                <circle cx={bodyX} cy={bodyY} r="13" fill="#FFE34D" stroke="#111" strokeWidth="2.6" />
              </g>
            ) : (
              <g>
                <circle cx={bodyX} cy={bodyY} r="12" fill="#FFF8EC" stroke="#111" strokeWidth="2.6" />
                <circle cx={bodyX + 5} cy={bodyY - 4} r="10" fill={skyTop} stroke="none" />
              </g>
            )}

            {band === "dawn" && (
              // A stork at sunrise, because of course.
              <g fill="#FFF8EC" opacity="0.85" transform="translate(232 44)">
                <path d="M0 12 q7 -12 18 -9 l10 -7 -1 6 6 2 -6 3 q3 10 -6 14 q-12 4 -21 -9 Z" />
                <path d="M12 14 l-2 10 M18 14 l1 10" stroke="#FFF8EC" strokeWidth="1.6" />
              </g>
            )}

            {/* horizon */}
            <path
              d="M0 132 C60 118 110 140 160 132 C210 124 262 142 320 130 L320 160 L0 160 Z"
              fill="#111111"
            />
          </svg>
        </div>
      </ToyShell>

      <SaveBar onSave={() => saveTime(minute)} />
    </div>
  );
}
