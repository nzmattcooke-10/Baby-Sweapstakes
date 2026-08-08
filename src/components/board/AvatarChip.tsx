"use client";

import { Avatar } from "@/components/avatars/Avatar";
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
}: {
  entry: BoardEntry;
  /** Spoken alongside the name, e.g. "Saturday 15 August". */
  detail: string;
  selected: boolean;
  onSelect: (id: string | null) => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : entry.participantId)}
      aria-expanded={selected}
      className={`rounded-full ${
        selected
          ? "ring-[3px] ring-ink ring-offset-[3px] ring-offset-[var(--hl-yellow)]"
          : "ring-2 ring-surface"
      }`}
      style={{ lineHeight: 0 }}
    >
      <Avatar
        avatarKey={entry.avatarKey}
        accent={entry.accentColor}
        photo={entry.avatarPhoto}
        size={size}
      />
      <span className="sr-only">
        {entry.displayName}: {detail}
      </span>
    </button>
  );
}
