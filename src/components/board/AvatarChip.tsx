"use client";

import { Avatar } from "@/components/avatars/Avatar";
import { Icon } from "@/components/zine/Icon";
import type { BoardEntry } from "@/lib/board-access";

/**
 * One person's marker on a board panel.
 *
 * Two things make this work with a keyboard. It's a real button, and the panels
 * render these in value order — chronological, or ascending — so tabbing walks
 * the data sensibly whatever the pixels are doing. The visual position is a
 * presentation detail layered on top of a sane DOM.
 */
export function AvatarChip({
  entry,
  detail,
  selected,
  onSelect,
  size = 34,
  struck = false,
  won = false,
  dimmed = false,
}: {
  entry: BoardEntry;
  /** Spoken alongside the name, e.g. "Saturday 15 August". */
  detail: string;
  selected: boolean;
  onSelect: (id: string | null) => void;
  size?: number;
  /** Cross the avatar out — used on the calendar for a day that's now passed. */
  struck?: boolean;
  /** Closest guess in this category once the baby's details are in. */
  won?: boolean;
  /** Faded back because someone else won this category. Deliberately gentle. */
  dimmed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : entry.participantId)}
      aria-expanded={selected}
      className={`relative rounded-full ${
        selected
          ? "ring-[3px] ring-ink ring-offset-[3px] ring-offset-[var(--hl-yellow)]"
          : won
            ? "ring-[3px] ring-[var(--hl-yellow)]"
            : "ring-2 ring-surface"
      } ${dimmed ? "opacity-45" : ""}`}
      style={{ lineHeight: 0 }}
    >
      <Avatar
        avatarKey={entry.avatarKey}
        accent={entry.accentColor}
        photo={entry.avatarPhoto}
        size={size}
      />
      {struck && (
        // A hand-drawn red cross for a guess whose day has gone by. Drawn over
        // the avatar, ignoring pointer events so the chip stays tappable.
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className="pointer-events-none absolute inset-0"
        >
          <g
            stroke="var(--danger)"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M17 21 Q54 47 84 82" />
            <path d="M83 20 Q49 51 16 83" />
          </g>
        </svg>
      )}
      {won && (
        // A star pinned to the winner, so the result never rests on colour or
        // opacity alone.
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full border-2 border-ink"
          style={{
            width: Math.max(14, size * 0.46),
            height: Math.max(14, size * 0.46),
            background: "var(--hl-yellow)",
            color: "#111",
          }}
        >
          <Icon name="star" size={Math.max(8, size * 0.28)} strokeWidth={2.8} />
        </span>
      )}
      <span className="sr-only">
        {entry.displayName}: {detail}
        {struck ? " (this day has passed)" : ""}
        {/* "Winner" rather than "closest guess": on boy-or-girl there is no
            close, only right — and this reads correctly on every panel. */}
        {won ? " — winner" : ""}
      </span>
    </button>
  );
}
