"use client";

import { BabySvg } from "@/components/baby/BabySvg";
import type { BoardEntry } from "@/lib/board-access";
import { Icon } from "@/components/zine/Icon";
import { WEEKDAY_LABELS, formatShortDate, type CalendarWindow } from "@/lib/window";
import { AvatarChip } from "./AvatarChip";
import { GuessDetail } from "./GuessDetail";
import { PanelShell } from "./PanelShell";

/**
 * The centrepiece: everyone's avatar sitting on the day they picked.
 *
 * Days are rendered in date order, so tabbing through the avatars walks
 * forward through time regardless of where they land on screen.
 */
export function CalendarBoard({
  window: win,
  entries,
  selectedId,
  onSelect,
  actualDate,
  baby,
  summary,
  winners,
}: {
  window: CalendarWindow;
  entries: BoardEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** The day the baby actually arrived, once known. */
  actualDate?: string | null;
  /** The baby's shape, for the drawing that marks the arrival day. */
  baby?: {
    weightGrams: number;
    lengthMm: number;
    headwear: "bonnet" | "cap" | "none";
  } | null;
  summary?: React.ReactNode;
  winners?: string[];
}) {
  const wonBy = new Set(winners ?? []);
  const decided = wonBy.size > 0;
  const byDate = new Map<string, BoardEntry[]>();
  for (const entry of entries) {
    if (!entry.birthDate) continue;
    const list = byDate.get(entry.birthDate) ?? [];
    list.push(entry);
    byDate.set(entry.birthDate, list);
  }

  const selected = entries.find((e) => e.participantId === selectedId);

  const rows = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, people]) =>
      people.map((person) => ({
        id: person.participantId,
        cells: [person.displayName, formatShortDate(date)],
      })),
    );

  return (
    <PanelShell
      title="The day"
      icon="day"
      box="drawn"
      summary={summary ?? `${entries.length} guesses across the window`}
      columns={["Who", "Day"]}
      rows={rows}
    >
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            aria-hidden="true"
            className="marker-caps pb-1 text-center text-xs text-ink-soft"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: win.leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {win.days.map((day) => {
          const people = byDate.get(day.iso) ?? [];
          // The day it actually happened outranks the day it was due, so it
          // takes the cell's colour and the due-date star steps aside.
          const isBirthDay = actualDate === day.iso;
          return (
            <div
              key={day.iso}
              className={`min-h-[62px] p-0.5 ${
                isBirthDay ? "border-[3px] border-ink" : "border-[2px] border-ink"
              }`}
              style={{
                borderRadius: "var(--radius-tick)",
                background: isBirthDay
                  ? "var(--hl-teal)"
                  : day.isDueDate
                    ? "var(--hl-yellow)"
                    : "var(--surface-sunk)",
                color: isBirthDay || day.isDueDate ? "#111" : undefined,
              }}
            >
              <div
                aria-hidden="true"
                className={`marker-caps text-center text-xs leading-tight ${
                  isBirthDay || day.isDueDate ? "" : "text-ink-soft"
                }`}
              >
                {day.dayOfMonth}
                {isBirthDay ? (
                  <BabySvg
                    weightGrams={baby?.weightGrams ?? 3400}
                    lengthMm={baby?.lengthMm ?? 500}
                    headwear={baby?.headwear ?? "none"}
                    width={26}
                    className="mx-auto"
                  />
                ) : (
                  day.isDueDate && (
                    <Icon name="star" size={11} className="mx-auto" strokeWidth={2.6} />
                  )
                )}
              </div>
              {isBirthDay && <span className="sr-only">The baby arrived today.</span>}
              <div className="flex flex-wrap justify-center gap-0.5">
                {people.map((person) => (
                  <AvatarChip
                    key={person.participantId}
                    entry={person}
                    detail={formatShortDate(day.iso)}
                    selected={person.participantId === selectedId}
                    onSelect={onSelect}
                    size={22}
                    // The cross means "this day went by without a baby". Once
                    // she's actually here it says nothing, and it clashed with
                    // the winner's star — so the result takes over from it.
                    struck={day.isPast && !actualDate}
                    won={wonBy.has(person.participantId)}
                    dimmed={decided && !wonBy.has(person.participantId)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && <GuessDetail entry={selected} onClose={() => onSelect(null)} />}
    </PanelShell>
  );
}
