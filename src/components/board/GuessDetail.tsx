"use client";

import { useEffect, useRef } from "react";
import { Avatar } from "@/components/avatars/Avatar";
import type { BoardEntry } from "@/lib/board-access";
import { formatLengthBoth, formatTime, formatWeightBoth } from "@/lib/units";
import { formatLongDate } from "@/lib/window";

/**
 * The full set of somebody's guesses, shown when you tap their avatar.
 *
 * Rendered *inline beneath the panel* rather than as a floating popover. That
 * was a deliberate trade: a positioned popover needs a focus trap, escape
 * handling, collision detection and a tab order that lies about where you are.
 * Inline, the browser's own focus order is already correct, Escape is the only
 * key handler needed, and it can't be clipped off the edge of a phone screen.
 */
export function GuessDetail({
  entry,
  onClose,
}: {
  entry: BoardEntry;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [entry.participantId]);

  const rows: Array<[string, string]> = [
    ["Day", entry.birthDate ? formatLongDate(entry.birthDate) : "—"],
    [
      "Time",
      entry.birthMinuteOfDay !== null ? formatTime(entry.birthMinuteOfDay) : "—",
    ],
    ["Weight", entry.weightGrams !== null ? formatWeightBoth(entry.weightGrams) : "—"],
    ["Length", entry.lengthMm !== null ? formatLengthBoth(entry.lengthMm) : "—"],
    [
      "Boy or girl",
      entry.sex === "girl" ? "A girl" : entry.sex === "boy" ? "A boy" : "—",
    ],
  ];

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="group"
      aria-label={`${entry.displayName}'s guesses`}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      className="drawn-c ink-in mt-3 px-4 py-4"
    >
      <div className="mb-2 flex items-center gap-3">
        <Avatar avatarKey={entry.avatarKey} accent={entry.accentColor} size={40} />
        <p className="marker-caps flex-1 text-2xl leading-tight">{entry.displayName}</p>
        <button
          type="button"
          onClick={onClose}
          className="drawn-d flex min-h-[46px] min-w-[46px] items-center justify-center"
        >
          <span aria-hidden="true" className="text-xl leading-none">&times;</span>
          <span className="sr-only">Close {entry.displayName}&rsquo;s guesses</span>
        </button>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-base">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
