"use client";

import { BabySvg } from "@/components/baby/BabySvg";
import type { BoardEntry } from "@/lib/board-access";
import { AvatarChip } from "./AvatarChip";
import { GuessDetail } from "./GuessDetail";
import { PanelShell } from "./PanelShell";

/**
 * A tally, not a race. Counts and percentages are written out, and each side is
 * labelled — the bonnet and cap are reinforcement, so the panel never depends
 * on telling pink from blue.
 */
export function SexBoard({
  entries,
  selectedId,
  onSelect,
  actualSex,
  baby,
  summary,
  winners,
}: {
  entries: BoardEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Which side turned out to be right, once known. */
  actualSex?: "boy" | "girl" | null;
  baby?: { weightGrams: number; lengthMm: number } | null;
  summary?: React.ReactNode;
  winners?: string[];
}) {
  const wonBy = new Set(winners ?? []);
  const decided = wonBy.size > 0;
  const sides = [
    { key: "girl" as const, label: "A girl", headwear: "bonnet" as const },
    { key: "boy" as const, label: "A boy", headwear: "cap" as const },
  ];

  const total = entries.filter((e) => e.sex !== null).length;
  const selected = entries.find((e) => e.participantId === selectedId);

  return (
    <PanelShell
      title="Boy or girl"
      icon="sex"
      box="drawn-c"
      summary={summary}
      columns={["Who", "Guess"]}
      rows={entries
        .filter((e) => e.sex !== null)
        .map((entry) => ({
          id: entry.participantId,
          cells: [entry.displayName, entry.sex === "girl" ? "A girl" : "A boy"],
        }))}
    >
      <div className="grid grid-cols-2 gap-3">
        {sides.map((side) => {
          const people = entries.filter((e) => e.sex === side.key);
          const percent = total === 0 ? 0 : Math.round((people.length / total) * 100);

          // Once it's known, the right side is drawn at the real baby's shape
          // and the other fades back — the answer, not just a tally.
          const isAnswer = actualSex === side.key;
          const isWrongSide = actualSex != null && !isAnswer;

          return (
            <div
              key={side.key}
              className={`plate px-3 py-3 text-center ${
                isWrongSide ? "opacity-45" : ""
              }`}
              style={
                isAnswer
                  ? { background: "var(--hl-teal)", color: "#111" }
                  : undefined
              }
            >
              <div aria-hidden="true">
                <BabySvg
                  weightGrams={isAnswer ? (baby?.weightGrams ?? 3400) : 3400}
                  lengthMm={isAnswer ? (baby?.lengthMm ?? 500) : 500}
                  headwear={side.headwear}
                  width={78}
                  className="mx-auto"
                />
              </div>
              <p className="marker-caps text-xl">
                {side.label}
                {isAnswer && <span className="sr-only"> — this is what she was</span>}
              </p>
              <p className="text-sm" style={{ color: "#5a5044" }}>
                {people.length} {people.length === 1 ? "guess" : "guesses"} ·{" "}
                {percent}%
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {people.map((person) => (
                  <AvatarChip
                    key={person.participantId}
                    entry={person}
                    detail={side.label}
                    selected={person.participantId === selectedId}
                    onSelect={onSelect}
                    size={30}
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
