"use client";

import { useState } from "react";
import { saveDate } from "@/app/guess/actions";
import { dateRemark } from "@/lib/commentary";
import {
  WEEKDAY_LABELS,
  formatLongDate,
  type CalendarDay,
  type CalendarWindow,
} from "@/lib/window";
import { Icon } from "@/components/zine/Icon";
import { SaveBar } from "./SaveBar";

/**
 * Underneath the squares this is a radio group, which is what gives it arrow
 * key navigation and a sensible screen reader announcement without any custom
 * key handling. Each day's accessible name is the full date plus whatever makes
 * it special ("due date", "already gone"), because "15" on its own tells you
 * nothing.
 *
 * Days are grouped by month rather than laid out as one continuous strip. The
 * window can straddle a month boundary, and a grid with no month headings
 * leaves people counting squares to work out where September starts.
 */
function groupByMonth(days: CalendarDay[]): Array<{
  month: string;
  days: CalendarDay[];
}> {
  const groups: Array<{ month: string; days: CalendarDay[] }> = [];
  for (const day of days) {
    const last = groups.at(-1);
    if (!last || last.month !== day.monthLabel) {
      groups.push({ month: day.monthLabel, days: [day] });
    } else {
      last.days.push(day);
    }
  }
  return groups;
}

export function CalendarPanel({
  window: win,
  initial,
}: {
  window: CalendarWindow;
  initial: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(initial);

  const selectedDay = win.days.find((d) => d.iso === selected) ?? null;
  const remark = selectedDay ? dateRemark(selectedDay.offsetFromDue) : null;

  if (win.days.length === 0) {
    return (
      <p className="drawn px-6 py-6 text-center text-lg">
        The guessing window has passed — this baby is thoroughly overdue.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <fieldset className="border-0 p-0">
        <legend className="sr-only">Pick the day you think the baby arrives</legend>

        {groupByMonth(win.days).map((group) => (
          <div key={group.month} className="mb-5">
            <h2 className="marker-caps mb-3 text-center text-2xl">
              {group.month}
            </h2>

            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  aria-hidden="true"
                  className="marker-caps pb-1.5 text-center text-sm text-ink-soft"
                >
                  {label}
                </div>
              ))}

              {Array.from({ length: group.days[0].weekdayIndex }, (_, i) => (
                <div key={`blank-${i}`} aria-hidden="true" />
              ))}

              {group.days.map((day) => {
                const isSelected = selected === day.iso;
                const description = [
                  formatLongDate(day.iso),
                  day.isDueDate ? "the due date" : null,
                  day.isPast ? "already gone" : null,
                ]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <label
                    key={day.iso}
                    className={`marker-caps relative flex aspect-square min-h-[46px] cursor-pointer flex-col items-center justify-center border-[2.5px] text-xl ${
                      day.isPast
                        ? "cursor-not-allowed border-transparent text-ink-soft opacity-40"
                        : "border-ink"
                    }`}
                    style={{
                      borderRadius:
                        day.dayOfMonth % 2 === 0
                          ? "var(--radius-tick)"
                          : "var(--radius-tick-b)",
                      background: day.isPast
                        ? "var(--surface-sunk)"
                        : isSelected
                          ? "var(--hl-yellow)"
                          : "var(--surface)",
                      color: isSelected ? "#111" : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      name="birthDate"
                      value={day.iso}
                      checked={isSelected}
                      disabled={day.isPast}
                      onChange={() => setSelected(day.iso)}
                      className="sr-only"
                      aria-label={description}
                    />
                    <span aria-hidden="true">{day.dayOfMonth}</span>
                    {day.isDueDate && (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 flex items-center gap-0.5 text-[10px] leading-none"
                      >
                        <Icon name="star" size={10} strokeWidth={2.8} />
                        due
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="drawn-c min-h-[5rem] px-4 py-4 text-center">
        {selectedDay && remark ? (
          <>
            <p className="marker-caps text-2xl">{formatLongDate(selectedDay.iso)}</p>
            <p className="mt-1 text-lg text-ink-soft italic" aria-live="polite">
              {remark.text}
            </p>
          </>
        ) : (
          <p className="text-lg text-ink-soft">
            Tap a day to see what the family makes of it.
          </p>
        )}
      </div>

      <SaveBar
        onSave={() => saveDate(selected as string)}
        disabled={selected === null}
        disabledHint="Pick a day to carry on."
      />
    </div>
  );
}
