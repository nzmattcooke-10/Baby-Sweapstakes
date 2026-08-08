"use client";

import { useState } from "react";
import type { BoardEntry } from "@/lib/board-access";
import { formatLengthBoth, formatTime, formatWeightBoth } from "@/lib/units";
import type { CalendarWindow } from "@/lib/window";
import { AxisPanel } from "./AxisPanel";
import { CalendarBoard } from "./CalendarBoard";
import { SexBoard } from "./SexBoard";

/**
 * Selection is held here rather than in each panel so only one person's details
 * are open at a time — six expanded cards at once would bury the board you came
 * to look at.
 *
 * It records *which panel* the selection belongs to, not just who. Every panel
 * contains every participant, so keying on the id alone made all six render
 * their own copy of the same detail card, and focus landed on whichever
 * mounted last — you'd tap someone on the calendar and get thrown down to the
 * boy-or-girl panel.
 */
type Selection = { panel: string; participantId: string } | null;

export function Board({
  entries,
  window: win,
}: {
  entries: BoardEntry[];
  window: CalendarWindow;
}) {
  const [selection, setSelection] = useState<Selection>(null);

  /** Per-panel selection props, so a panel only ever opens its own card. */
  const panelProps = (panel: string) => ({
    selectedId: selection?.panel === panel ? selection.participantId : null,
    onSelect: (participantId: string | null) =>
      setSelection(participantId ? { panel, participantId } : null),
  });

  const withWeight = entries.filter((e) => e.weightGrams !== null);
  const withLength = entries.filter((e) => e.lengthMm !== null);
  const withTime = entries.filter((e) => e.birthMinuteOfDay !== null);

  // The guess inputs allow 0.5–8kg and 25–75cm, far wider than the everyday
  // window, so the ruler has to grow to whatever people actually guessed —
  // otherwise a 6kg punt lands in the margin past the end of the line.
  const weightAxis = scaleAxis(
    withWeight.map((e) => e.weightGrams!),
    { min: 2000, max: 5000 },
    1000,
    (v) => `${v / 1000}kg`,
  );
  const lengthAxis = scaleAxis(
    withLength.map((e) => e.lengthMm!),
    { min: 450, max: 550 },
    50,
    (v) => `${v / 10}cm`,
  );

  return (
    <div className="flex flex-col gap-4">
      <CalendarBoard
        window={win}
        entries={entries}
        {...panelProps("calendar")}
      />

      <AxisPanel
        title="The weight"
        icon="weight"
        box="drawn-b"
        summary={average(withWeight.map((e) => e.weightGrams!), (v) =>
          formatWeightBoth(Math.round(v)),
        )}
        items={withWeight.map((entry) => ({
          entry,
          value: entry.weightGrams!,
          label: formatWeightBoth(entry.weightGrams!),
        }))}
        {...weightAxis}
        {...panelProps("weight")}
      />

      <AxisPanel
        title="The time"
        icon="time"
        box="drawn-c"
        items={withTime.map((entry) => ({
          entry,
          value: entry.birthMinuteOfDay!,
          label: formatTime(entry.birthMinuteOfDay!),
        }))}
        min={0}
        max={1439}
        ticks={[
          { value: 0, label: "12am" },
          { value: 360, label: "6am" },
          { value: 720, label: "12pm" },
          { value: 1080, label: "6pm" },
          { value: 1439, label: "12am" },
        ]}
        {...panelProps("time")}
        // Night to day and back, in the zine's own three inks rather than a
        // photographic sky gradient.
        trackStyle={{
          background:
            "linear-gradient(90deg,#111 0%,#111 17%,var(--hl-pink) 26%,var(--hl-yellow) 40%,var(--hl-yellow) 62%,var(--hl-pink) 74%,#111 84%,#111 100%)",
        }}
      />

      <AxisPanel
        title="The length"
        icon="length"
        box="drawn-d"
        summary={average(withLength.map((e) => e.lengthMm!), (v) =>
          formatLengthBoth(Math.round(v)),
        )}
        items={withLength.map((entry) => ({
          entry,
          value: entry.lengthMm!,
          label: formatLengthBoth(entry.lengthMm!),
        }))}
        {...lengthAxis}
        {...panelProps("length")}
      />

      <SexBoard entries={entries} {...panelProps("sex")} />
    </div>
  );
}

function average(values: number[], format: (value: number) => string): string {
  if (values.length === 0) return "";
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return `Family average: ${format(mean)}`;
}

/**
 * Size an axis to the guesses on it. The `fallback` window is the everyday range
 * that shows when nobody strays outside it; any value beyond it pushes the ends
 * out to the next round `step`. Ticks land on those round values, and the domain
 * carries half a step of slack at each end so an extreme guess sits *on* the
 * ruler rather than jammed against its edge.
 */
function scaleAxis(
  values: number[],
  fallback: { min: number; max: number },
  step: number,
  label: (value: number) => string,
): { min: number; max: number; ticks: Array<{ value: number; label: string }> } {
  const firstTick = Math.floor(Math.min(fallback.min, ...values) / step) * step;
  const lastTick = Math.ceil(Math.max(fallback.max, ...values) / step) * step;

  const ticks: Array<{ value: number; label: string }> = [];
  for (let value = firstTick; value <= lastTick + step / 2; value += step) {
    ticks.push({ value, label: label(value) });
  }

  return { min: firstTick - step / 2, max: lastTick + step / 2, ticks };
}
