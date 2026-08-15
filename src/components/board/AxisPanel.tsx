"use client";

import { BabySvg } from "@/components/baby/BabySvg";
import type { BoardEntry } from "@/lib/board-access";
import type { IconName } from "@/components/zine/Icon";
import { AvatarChip } from "./AvatarChip";
import { GuessDetail } from "./GuessDetail";
import { PanelShell } from "./PanelShell";
import { packLanes } from "./lanes";

/**
 * Weight, length and time are all the same panel: a value on a line, with
 * avatars beeswarmed along it. Sharing one implementation means they behave
 * identically for keyboard and screen reader users, and there's one place to
 * fix rather than three.
 */

export type AxisItem = {
  entry: BoardEntry;
  value: number;
  label: string;
};

/**
 * Where the real baby landed on this axis. Rendered below the ruler on a solid
 * stem, opposite the guesses' dotted ones, so the truth never reads as just
 * another guess — and it can't collide with the swarm above.
 */
export type AxisActual = {
  value: number;
  /** Spoken description, e.g. "Eleanor weighed 2.95 kg". */
  label: string;
  weightGrams: number;
  lengthMm: number;
  headwear: "bonnet" | "cap" | "none";
};

const CHIP = 34;
const LANE_HEIGHT = 38;

export function AxisPanel({
  title,
  icon,
  box,
  summary,
  items,
  min,
  max,
  ticks,
  selectedId,
  onSelect,
  trackClassName,
  trackStyle,
  actual,
  winners,
}: {
  title: string;
  icon: IconName;
  box?: "drawn" | "drawn-b" | "drawn-c" | "drawn-d";
  summary?: React.ReactNode;
  items: AxisItem[];
  min: number;
  max: number;
  ticks: Array<{ value: number; label: string }>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  trackClassName?: string;
  trackStyle?: React.CSSProperties;
  /** The real result, once the host has entered it. */
  actual?: AxisActual | null;
  /** Participant ids with the closest guess — more than one when tied. */
  winners?: string[];
}) {
  const wonBy = new Set(winners ?? []);
  const decided = wonBy.size > 0;
  // Ascending, so tab order runs lightest-to-heaviest / earliest-to-latest.
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const positions = sorted.map(
    (item) => ((item.value - min) / (max - min)) * 100,
  );
  const lanes = packLanes(positions, 11);
  const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1));

  const selected = sorted.find(
    (item) => item.entry.participantId === selectedId,
  );

  return (
    <PanelShell
      title={title}
      icon={icon}
      box={box}
      summary={summary}
      columns={["Who", title]}
      rows={sorted.map((item) => ({
        id: item.entry.participantId,
        cells: [item.entry.displayName, item.label],
      }))}
    >
      <div className="pt-1">
        <div
          className="relative"
          style={{ height: laneCount * LANE_HEIGHT + 8 }}
        >
          {/* A dotted plumb line from each avatar down to the ruler, so a chip
              lifted into an upper lane still reads against its value. Every line
              is drawn before every chip, so avatars always sit on top of them. */}
          {sorted.map((item, index) => (
            <div
              key={`line-${item.entry.participantId}`}
              aria-hidden="true"
              className="absolute w-0 -translate-x-1/2 border-l-2 border-dotted border-ink-soft"
              style={{
                left: `${positions[index]}%`,
                bottom: 0,
                height: lanes[index] * LANE_HEIGHT + CHIP / 2,
              }}
            />
          ))}

          {sorted.map((item, index) => (
            <div
              key={item.entry.participantId}
              className="absolute"
              style={{
                left: `${positions[index]}%`,
                bottom: lanes[index] * LANE_HEIGHT,
                transform: "translateX(-50%)",
              }}
            >
              <AvatarChip
                entry={item.entry}
                detail={item.label}
                selected={item.entry.participantId === selectedId}
                onSelect={onSelect}
                size={CHIP}
                won={wonBy.has(item.entry.participantId)}
                dimmed={decided && !wonBy.has(item.entry.participantId)}
              />
            </div>
          ))}
        </div>

        {/* The axis is a ruled line with a drawn edge, not a progress bar. */}
        <div
          aria-hidden="true"
          className={`h-3.5 border-[2px] border-ink ${trackClassName ?? "bg-sunk"}`}
          style={{
            borderRadius: "var(--radius-rule)",
            ...trackStyle,
          }}
        />

        {/* The real baby, hanging under the ruler on a solid stem. */}
        {actual && (
          <div className="relative h-[52px]">
            <div
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{
                left: `${((actual.value - min) / (max - min)) * 100}%`,
              }}
            >
              <span
                aria-hidden="true"
                className="w-0 border-l-[3px] border-ink"
                style={{ height: 8 }}
              />
              <BabySvg
                weightGrams={actual.weightGrams}
                lengthMm={actual.lengthMm}
                headwear={actual.headwear}
                width={38}
              />
            </div>
            <p className="sr-only">{actual.label}</p>
          </div>
        )}

        <div aria-hidden="true" className="relative mt-1.5 h-6">
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className="marker-caps absolute -translate-x-1/2 text-sm text-ink-soft"
              style={{ left: `${((tick.value - min) / (max - min)) * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>

      {selected && (
        <GuessDetail entry={selected.entry} onClose={() => onSelect(null)} />
      )}
    </PanelShell>
  );
}
