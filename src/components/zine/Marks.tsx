/**
 * The marks a hand makes around the content: the swipe under a heading, the
 * arrow pointing at the thing that matters, the little burst that says "this
 * one".
 *
 * All decorative, all `aria-hidden`. Nothing in here is ever the only carrier
 * of meaning — if a burst marks a selected option, the option also says so in
 * words.
 */

/** The marker swipe under a heading. Sits in flow, so it can't overlap text. */
export function Underline({
  color = "teal",
  className = "",
  width = "8rem",
}: {
  color?: "teal" | "pink" | "yellow";
  className?: string;
  width?: string;
}) {
  const stroke = {
    teal: "var(--hl-teal)",
    pink: "var(--hl-pink)",
    yellow: "var(--hl-yellow)",
  }[color];

  return (
    <svg
      viewBox="0 0 160 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ width, height: "0.7rem", display: "block" }}
    >
      {/* One pass, pressed harder in the middle, lifting at the end. */}
      <path
        d="M3 7.4 C 34 3.1, 62 9.2, 96 5.4 C 122 2.5, 142 6.4, 157 4.2"
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A doodled arrow. `dir` chooses which way the tail curves, so a page can point
 * at things in more than one direction without the arrows looking cloned.
 */
export function Arrow({
  dir = "right",
  size = 44,
  className,
}: {
  dir?: "right" | "down" | "downLeft";
  size?: number;
  className?: string;
}) {
  const d = {
    right:
      "M4 22.6 C 18 14.8, 34 13.4, 52 18.2 M44.4 10.2 C 47.4 13.6, 50 16.2, 52.4 18.4 C 49.6 20.8, 47.2 23.8, 45.2 27.4",
    down: "M22 4 C 14.6 16.8, 15.8 30.4, 21.6 44 M12.4 36.2 C 15.6 39, 18.6 41.6, 21.6 44.2 C 24.2 41.2, 27.4 38.4, 31 36",
    downLeft:
      "M46 6 C 40 22, 30 34, 12 42 M20.6 41 C 16.8 41.6, 14 42.2, 11.8 42.4 C 12.8 39.8, 13.4 36.6, 13.6 32.8",
  }[dir];

  const box = dir === "right" ? "0 0 58 38" : dir === "down" ? "0 0 44 50" : "0 0 56 50";

  return (
    <svg
      viewBox={box}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * The radiating strokes that mark an active control in this world — the
 * scribbled "ping" around something you just pressed.
 */
export function Burst({
  side = "both",
  className = "",
}: {
  side?: "left" | "right" | "both";
  className?: string;
}) {
  const one = (flip: boolean) => (
    <svg
      viewBox="0 0 16 34"
      width="14"
      height="30"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M13.4 6.4 L 6.2 2.6" />
      <path d="M14 17 L 4.4 16.4" />
      <path d="M13.6 27.2 L 6.6 31.4" />
    </svg>
  );

  return (
    <span aria-hidden="true" className={`pointer-events-none ${className}`}>
      {side !== "right" && one(false)}
      {side !== "left" && one(true)}
    </span>
  );
}
