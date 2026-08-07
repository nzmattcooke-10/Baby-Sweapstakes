"use client";

import { Avatar } from "@/components/avatars/Avatar";
import type { BoardEntry } from "@/lib/board-access";
import { normaliseName } from "@/lib/scoring";
import { Icon } from "@/components/zine/Icon";
import { PanelShell } from "./PanelShell";

/**
 * Names, once the host has released them. Identical guesses are grouped, so
 * three people backing "Ava" reads as a bloc rather than three separate rows.
 *
 * Deliberately real text at real sizes, not a canvas word cloud — a cloud can't
 * be read by a screen reader, can't be zoomed, and reliably renders the most
 * interesting answers at the smallest size.
 */
export function NameBoard({ entries }: { entries: BoardEntry[] }) {
  const groups = new Map<string, { display: string; people: BoardEntry[] }>();

  for (const entry of entries) {
    if (!entry.firstName) continue;
    const key = normaliseName(entry.firstName);
    const group = groups.get(key);
    if (group) group.people.push(entry);
    else groups.set(key, { display: entry.firstName, people: [entry] });
  }

  const sorted = [...groups.values()].sort(
    (a, b) => b.people.length - a.people.length || a.display.localeCompare(b.display),
  );

  return (
    <PanelShell
      title="The name"
      icon="name"
      box="drawn-b"
      summary={`${sorted.length} different names in the running`}
      columns={["Who", "Name"]}
      rows={entries
        .filter((e) => e.firstName)
        .map((entry) => ({
          id: entry.participantId,
          cells: [entry.displayName, entry.firstName!],
        }))}
    >
      <ul className="flex flex-wrap gap-2">
        {sorted.map((group) => (
          <li
            key={group.display}
            className="drawn-d flex items-center gap-2 px-3 py-2"
          >
            <span className="marker-caps text-xl">{group.display}</span>
            {group.people.length > 1 && (
              <span className="text-sm text-ink-soft">
                ×{group.people.length}
              </span>
            )}
            <span className="flex -space-x-1.5">
              {group.people.map((person) => (
                <Avatar
                  key={person.participantId}
                  avatarKey={person.avatarKey}
                  accent={person.accentColor}
                  size={24}
                />
              ))}
            </span>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

/** Shown in place of the panel while names are still under wraps. */
export function NameBoardLocked({ count }: { count: number }) {
  return (
    <section className="drawn-b flex flex-col items-center px-5 py-5 text-center">
      <Icon name="sealed" size={34} />
      <h2 className="marker-caps mt-2 text-2xl">The name</h2>
      <p className="mt-1.5 max-w-sm text-base text-ink-soft">
        {count} name {count === 1 ? "guess is" : "guesses are"} sealed until the
        baby&rsquo;s name is announced — no influencing the parents.
      </p>
    </section>
  );
}
