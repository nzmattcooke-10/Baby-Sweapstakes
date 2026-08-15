"use client";

import { useState } from "react";
import type { BoardEntry } from "@/lib/board-access";
import type { ActualValues, CategoryKey } from "@/lib/scoring";
import {
  formatLength,
  formatLengthBoth,
  formatTime,
  formatWeight,
  formatWeightBoth,
} from "@/lib/units";
import {
  formatLongDate,
  formatShortDate,
  type CalendarWindow,
} from "@/lib/window";
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
  actual,
  winners,
  babyName,
}: {
  entries: BoardEntry[];
  window: CalendarWindow;
  /** The real result, once the host has entered any of it. */
  actual?: ActualValues | null;
  /** Closest guess per category — an array, because ties are real. */
  winners?: Record<CategoryKey, string[]> | null;
  /** Used to label the actual result on each panel. */
  babyName?: string | null;
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

  const nameById = new Map(entries.map((e) => [e.participantId, e.displayName]));
  const entryById = new Map(entries.map((e) => [e.participantId, e]));

  /**
   * A winner's own guess, in short form. Metric only — the winner line is
   * already carrying names, and the full both-units reading lives on the
   * "Eleanor:" line directly above it.
   *
   * Boy-or-girl returns null on purpose: the winners' guess *is* the actual
   * result, which the line above already states.
   */
  const guessOf = (id: string, category: CategoryKey): string | null => {
    const e = entryById.get(id);
    if (!e) return null;
    switch (category) {
      case "date":
        return e.birthDate ? formatShortDate(e.birthDate) : null;
      case "time":
        return e.birthMinuteOfDay !== null ? formatTime(e.birthMinuteOfDay) : null;
      case "weight":
        return e.weightGrams !== null ? formatWeight(e.weightGrams, "metric") : null;
      case "length":
        return e.lengthMm !== null ? formatLength(e.lengthMm, "metric") : null;
      case "sex":
        return null;
    }
  };

  /** "Closest: Nana Joy" under the panel title, naming every tied winner. */
  const winnerNote = (category: CategoryKey) => {
    const ids = winners?.[category] ?? [];
    if (ids.length === 0) return undefined;
    const names = ids.map((id) => nameById.get(id) ?? "Someone");
    const guesses = ids.map((id) => guessOf(id, category));

    // Tied winners can sit the same distance either side of the truth, so their
    // guesses aren't necessarily identical. When they agree, say the number once
    // and keep the line short; when they differ, pair each name with its own.
    const haveGuesses = guesses.every((g) => g !== null);
    const shared = haveGuesses && guesses.every((g) => g === guesses[0]);

    const parts =
      haveGuesses && !shared
        ? names.map((n, i) => `${n} (${guesses[i]})`)
        : names;

    // "Ann, Bob & Cat" rather than "Ann & Bob & Cat".
    const listed =
      parts.length > 1
        ? `${parts.slice(0, -1).join(", ")} & ${parts[parts.length - 1]}`
        : parts[0];
    // Boy-or-girl has no "close" and no tie-break: you either called it or you
    // didn't, and everyone who did shares the win equally.
    const lead =
      category === "sex"
        ? names.length > 1
          ? "Called it, all of them: "
          : "Called it: "
        : names.length > 1
          ? "Closest (tied): "
          : "Closest: ";

    return (
      <span className="marker-caps text-lg text-ink">
        {lead}
        <span className="hl hl-yellow">{listed}</span>
        {shared && <> — guessed {guesses[0]}</>}
      </span>
    );
  };

  /** What Eleanor actually did in this category, in words. */
  const actualValue = (category: CategoryKey): string | null => {
    if (!actual) return null;
    switch (category) {
      case "date":
        return actual.actualDate ? formatLongDate(actual.actualDate) : null;
      case "time":
        return actual.actualMinuteOfDay !== null
          ? formatTime(actual.actualMinuteOfDay)
          : null;
      case "weight":
        return actual.actualWeightGrams !== null
          ? formatWeightBoth(actual.actualWeightGrams)
          : null;
      case "length":
        return actual.actualLengthMm !== null
          ? formatLengthBoth(actual.actualLengthMm)
          : null;
      case "sex":
        return actual.actualSex === "girl"
          ? "A girl"
          : actual.actualSex === "boy"
            ? "A boy"
            : null;
    }
  };

  /**
   * The line(s) under a panel title: what actually happened, then who called it
   * closest. Teal is the truth and yellow is the winner, the same pairing the
   * calendar and the boy-or-girl cards already use. Falls back to whatever the
   * panel showed before the baby arrived.
   */
  const panelSummary = (
    category: CategoryKey,
    beforeArrival?: React.ReactNode,
  ): React.ReactNode => {
    const value = actualValue(category);
    const winner = winnerNote(category);
    if (!value && !winner) return beforeArrival;

    return (
      <span className="flex flex-col gap-0.5">
        {value && (
          <span className="marker-caps text-lg text-ink">
            {babyName ?? "The baby"}: <span className="hl hl-teal">{value}</span>
          </span>
        )}
        {winner}
      </span>
    );
  };

  // The baby's own proportions, for every drawing of her on the board.
  const babyShape =
    actual && actual.actualWeightGrams !== null
      ? {
          weightGrams: actual.actualWeightGrams,
          lengthMm: actual.actualLengthMm ?? 500,
          headwear:
            actual.actualSex === "girl"
              ? ("bonnet" as const)
              : actual.actualSex === "boy"
                ? ("cap" as const)
                : ("none" as const),
        }
      : null;

  // The guess inputs allow 0.5–8kg and 25–75cm, far wider than the everyday
  // window, so the ruler has to grow to whatever people actually guessed —
  // otherwise a 6kg punt lands in the margin past the end of the line. The
  // actual is folded in too, or a baby outside everyone's range would be drawn
  // off the end of the ruler.
  const weightAxis = scaleAxis(
    [
      ...withWeight.map((e) => e.weightGrams!),
      ...(actual?.actualWeightGrams != null ? [actual.actualWeightGrams] : []),
    ],
    { min: 2000, max: 5000 },
    1000,
    (v) => `${v / 1000}kg`,
  );
  const lengthAxis = scaleAxis(
    [
      ...withLength.map((e) => e.lengthMm!),
      ...(actual?.actualLengthMm != null ? [actual.actualLengthMm] : []),
    ],
    { min: 450, max: 550 },
    50,
    (v) => `${v / 10}cm`,
  );

  return (
    <div className="flex flex-col gap-4">
      <CalendarBoard
        window={win}
        entries={entries}
        actualDate={actual?.actualDate}
        baby={babyShape}
        summary={panelSummary("date")}
        winners={winners?.date}
        {...panelProps("calendar")}
      />

      <AxisPanel
        title="The weight"
        icon="weight"
        box="drawn-b"
        summary={panelSummary(
          "weight",
          average(withWeight.map((e) => e.weightGrams!), (v) =>
            formatWeightBoth(Math.round(v)),
          ),
        )}
        items={withWeight.map((entry) => ({
          entry,
          value: entry.weightGrams!,
          label: formatWeightBoth(entry.weightGrams!),
        }))}
        actual={
          babyShape && actual?.actualWeightGrams != null
            ? {
                value: actual.actualWeightGrams,
                label: `She weighed ${formatWeightBoth(actual.actualWeightGrams)}`,
                ...babyShape,
              }
            : null
        }
        winners={winners?.weight}
        {...weightAxis}
        {...panelProps("weight")}
      />

      <AxisPanel
        title="The time"
        icon="time"
        box="drawn-c"
        summary={panelSummary("time")}
        items={withTime.map((entry) => ({
          entry,
          value: entry.birthMinuteOfDay!,
          label: formatTime(entry.birthMinuteOfDay!),
        }))}
        actual={
          babyShape && actual?.actualMinuteOfDay != null
            ? {
                value: actual.actualMinuteOfDay,
                label: `She arrived at ${formatTime(actual.actualMinuteOfDay)}`,
                ...babyShape,
              }
            : null
        }
        winners={winners?.time}
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
        summary={panelSummary(
          "length",
          average(withLength.map((e) => e.lengthMm!), (v) =>
            formatLengthBoth(Math.round(v)),
          ),
        )}
        items={withLength.map((entry) => ({
          entry,
          value: entry.lengthMm!,
          label: formatLengthBoth(entry.lengthMm!),
        }))}
        actual={
          babyShape && actual?.actualLengthMm != null
            ? {
                value: actual.actualLengthMm,
                label: `She measured ${formatLengthBoth(actual.actualLengthMm)}`,
                ...babyShape,
              }
            : null
        }
        winners={winners?.length}
        {...lengthAxis}
        {...panelProps("length")}
      />

      <SexBoard
        entries={entries}
        actualSex={actual?.actualSex}
        baby={babyShape}
        summary={panelSummary("sex")}
        winners={winners?.sex}
        {...panelProps("sex")}
      />
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
