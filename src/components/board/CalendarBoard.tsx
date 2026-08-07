"use client";

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
}: {
  window: CalendarWindow;
  entries: BoardEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
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
      summary={`${entries.length} guesses across the window`}
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
          return (
            <div
              key={day.iso}
              className="min-h-[62px] border-[2px] border-ink p-0.5"
              style={{
                borderRadius: "var(--radius-tick)",
                background: day.isDueDate ? "var(--hl-yellow)" : "var(--surface-sunk)",
                color: day.isDueDate ? "#111" : undefined,
              }}
            >
              <div
                aria-hidden="true"
                className={`marker-caps text-center text-xs leading-tight ${
                  day.isDueDate ? "" : "text-ink-soft"
                }`}
              >
                {day.dayOfMonth}
                {day.isDueDate && (
                  <Icon name="star" size={11} className="mx-auto" strokeWidth={2.6} />
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-0.5">
                {people.map((person) => (
                  <AvatarChip
                    key={person.participantId}
                    entry={person}
                    detail={formatShortDate(day.iso)}
                    selected={person.participantId === selectedId}
                    onSelect={onSelect}
                    size={22}
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
