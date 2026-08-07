import { Icon } from "./Icon";

/**
 * The lock-in count, drawn as boxes on a sheet: one square per person, ticked
 * when they've committed.
 *
 * This is the pre-commit teaser, and it is safe by construction rather than by
 * restraint. The only thing it is given is two integers — how many have locked
 * in, and how many there are. There is no per-person data here to leak, in the
 * markup or anywhere else, because none was ever fetched.
 */
export function Tally({
  committed,
  total,
  className = "",
}: {
  committed: number;
  total: number;
  className?: string;
}) {
  if (total === 0) return null;

  // A very large family shouldn't produce four rows of boxes on a phone.
  const boxes = Math.min(total, 24);
  const scale = total > boxes ? boxes / total : 1;
  const filled = Math.round(committed * scale);

  return (
    <div className={className}>
      <ul
        aria-hidden="true"
        className="flex flex-wrap justify-center gap-1.5"
      >
        {Array.from({ length: boxes }, (_, i) => (
          <li
            key={i}
            className="flex h-7 w-7 items-center justify-center border-[2px] border-ink"
            style={{
              borderRadius:
                i % 2 === 0 ? "var(--radius-tick)" : "var(--radius-tick-b)",
              background: i < filled ? "var(--hl-yellow)" : "transparent",
              color: "#111",
            }}
          >
            {i < filled && <Icon name="tick" size={17} strokeWidth={2.6} />}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center text-lg">
        <strong className="marker-caps text-2xl">{committed}</strong> of{" "}
        <strong className="marker-caps text-2xl">{total}</strong> have locked in
      </p>
    </div>
  );
}
