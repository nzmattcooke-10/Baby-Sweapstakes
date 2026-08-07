import { roughCircle } from "./rough";

/**
 * A numbered step, ringed by hand.
 *
 * The number is circled rather than set bare because the marker face draws "1"
 * as a single leaning stroke — on its own beside an icon it reads as a stray
 * mark rather than as the first of six. The ring is the zine's own convention
 * for a numbered step and it makes every numeral unambiguous.
 */
export function StepNumber({
  n,
  emphasised = false,
  size = 38,
}: {
  n: number;
  /** The step you are on: filled in, and drawn a size up. */
  emphasised?: boolean;
  size?: number;
}) {
  const box = 48;
  const ring = roughCircle(box / 2, box / 2, 20, `step-${n}`, { wobble: 0.035 });
  const ring2 = roughCircle(box / 2, box / 2, 20, `step-${n}-b`, {
    wobble: 0.05,
  });

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${box} ${box}`}
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        {emphasised && <path d={ring} fill="var(--hl-yellow)" />}
        <path
          d={ring}
          stroke="var(--ink)"
          strokeWidth={emphasised ? 2.6 : 2}
          strokeLinecap="round"
        />
        <path
          d={ring2}
          stroke="var(--ink)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.38"
        />
      </svg>
      <span
        className="marker-caps relative leading-none"
        style={{
          fontSize: size * 0.46,
          color: emphasised ? "#111" : "var(--ink)",
        }}
      >
        {n}
      </span>
    </span>
  );
}
