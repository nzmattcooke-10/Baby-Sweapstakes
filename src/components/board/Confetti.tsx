/**
 * A one-off burst of paper thrown in from both wings when the board loads.
 *
 * No JavaScript and no client component: every scrap's trajectory is derived
 * from its index, so the server and the browser produce identical markup and
 * CSS does the rest. That also means it can never drift out of sync or cost a
 * hydration mismatch — the same rule the drawn geometry follows.
 *
 * Colours are the three highlighters and ink, because the confetti is made of
 * the same paper as everything else on the page.
 */

const COLOURS = [
  "var(--hl-yellow)",
  "var(--hl-pink)",
  "var(--hl-teal)",
  "var(--ink)",
];

const PER_SIDE = 16;
/** Two volleys, like a pair of party poppers going off one after the other. */
const BLASTS = 2;
const BLAST_GAP_MS = 500;
/** Kept tight so each volley reads as one bang rather than a steady trickle. */
const LAUNCH_SPREAD_MS = 180;

/** Deterministic 0–1 from an index. Never Math.random: the server draws this too. */
function spread(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Confetti() {
  const perBlast = PER_SIDE * 2;

  const pieces = Array.from({ length: perBlast * BLASTS }, (_, i) => {
    const blast = Math.floor(i / perBlast);
    const withinBlast = i % perBlast;
    const fromLeft = withinBlast < PER_SIDE;
    const n = fromLeft ? withinBlast : withinBlast - PER_SIDE;

    // Thrown inward and up, then carried down and across by gravity.
    const across = 38 + spread(i, 1) * 46; // vw travelled
    const down = 26 + spread(i, 2) * 52; // vh travelled
    const size = 11 + Math.round(spread(i, 3) * 10);

    return {
      key: i,
      fromLeft,
      colour: COLOURS[i % COLOURS.length],
      // Staggered up the edge rather than all from one point.
      top: `${6 + n * (78 / PER_SIDE) + spread(i, 4) * 6}%`,
      width: size,
      height: Math.max(6, Math.round(size * 0.62)),
      dx: `${fromLeft ? across : -across}vw`,
      dy: `${down}vh`,
      rot: `${(fromLeft ? 1 : -1) * (360 + Math.round(spread(i, 5) * 540))}deg`,
      dur: `${1500 + Math.round(spread(i, 6) * 1400)}ms`,
      // Each volley launches half a second after the one before it. The `i`-based
      // spread still differs per blast, so the second isn't a copy of the first.
      delay: `${blast * BLAST_GAP_MS + Math.round(spread(i, 7) * LAUNCH_SPREAD_MS)}ms`,
    };
  });

  return (
    <div
      aria-hidden="true"
      className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.key}
          className="confetti-piece absolute block border-[1.5px] border-ink"
          style={
            {
              top: p.top,
              [p.fromLeft ? "left" : "right"]: "-4%",
              width: p.width,
              height: p.height,
              background: p.colour,
              borderRadius: "var(--radius-tick)",
              "--dx": p.dx,
              "--dy": p.dy,
              "--rot": p.rot,
              "--dur": p.dur,
              "--delay": p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
