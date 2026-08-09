/**
 * Hand-drawn geometry.
 *
 * The first version of this redesign drew its illustrations with `<circle>`,
 * `<rect rx>` and one uniform stroke width, and the result was flat vector
 * clip-art wearing a marker palette — the single thing that made a page about
 * a baby read as nursery cute. Perfect primitives are the tell. A drawn line
 * wobbles along its length, doubles back at corners, overshoots where the hand
 * kept going, and gets its volume from hatching rather than from a fill.
 *
 * Everything here is deterministic: geometry is derived from a seed string, so
 * the server and the client produce identical paths and React never sees a
 * hydration mismatch. Never introduce Math.random here.
 */

/**
 * Every generator here is a pure function of its arguments, so identical calls
 * produce byte-identical output. The board draws the same person's avatar once
 * per panel — five-plus recomputes of the same paths per request — which on a
 * free Cloudflare Worker was enough to blow the per-request CPU budget (Error
 * 1102). Memoising by the full argument list collapses those repeats to one
 * computation, and the cache stays warm across requests in a reused isolate.
 *
 * The cache is keyed on the seed *and* every numeric/option argument, so a
 * differently-sized avatar (which changes hatch spacing) or a re-styled one
 * (new seed) never reads a stale entry. It's bounded by the distinct avatars in
 * a sweepstake — tens to low hundreds of small strings — so no eviction needed.
 */
const geometryCache = new Map<string, string | string[]>();

function memo<T extends string | string[]>(key: string, compute: () => T): T {
  const hit = geometryCache.get(key);
  if (hit !== undefined) return hit as T;
  const value = compute();
  geometryCache.set(key, value);
  return value;
}

/** Small, fast, deterministic PRNG (mulberry32) seeded from a string. */
function makeRng(seed: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Jitter helper: a signed deviation up to `amount`. */
function jitter(rng: () => number, amount: number): number {
  return (rng() * 2 - 1) * amount;
}

type Point = [number, number];

/**
 * A smooth path through points, using each midpoint as an on-curve anchor and
 * the sample itself as the control. Produces a continuous line with no corners,
 * which is what a felt tip actually leaves behind.
 */
function smoothPath(points: Point[], close: boolean): string {
  if (points.length < 2) return "";
  const parts: string[] = [];
  const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  if (close) {
    const start = mid(points[points.length - 1], points[0]);
    parts.push(`M ${r(start[0])} ${r(start[1])}`);
    for (let i = 0; i < points.length; i++) {
      const cur = points[i];
      const next = points[(i + 1) % points.length];
      const m = mid(cur, next);
      parts.push(`Q ${r(cur[0])} ${r(cur[1])} ${r(m[0])} ${r(m[1])}`);
    }
  } else {
    parts.push(`M ${r(points[0][0])} ${r(points[0][1])}`);
    for (let i = 1; i < points.length - 1; i++) {
      const cur = points[i];
      const m = mid(cur, points[i + 1]);
      parts.push(`Q ${r(cur[0])} ${r(cur[1])} ${r(m[0])} ${r(m[1])}`);
    }
    const last = points[points.length - 1];
    parts.push(`L ${r(last[0])} ${r(last[1])}`);
  }
  return parts.join(" ");
}

/** Trim float noise out of the emitted path data. */
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * A circle drawn by hand: sampled with a wandering radius, and carried past its
 * own starting point so the ends cross the way they do on paper.
 */
export function roughCircle(
  cx: number,
  cy: number,
  radius: number,
  seed: string,
  { wobble = 0.045, overshoot = 0.22, samples = 14 } = {},
): string {
  return memo(
    `c|${cx}|${cy}|${radius}|${wobble}|${overshoot}|${samples}|${seed}`,
    () => {
      const rng = makeRng(seed);
      const amp = radius * wobble;
      const points: Point[] = [];
      const total = samples + Math.round(samples * overshoot);
      // A drifting centre makes the loop lopsided rather than merely bumpy.
      const driftX = jitter(rng, amp * 0.7);
      const driftY = jitter(rng, amp * 0.7);
      const start = rng() * Math.PI * 2;

      for (let i = 0; i <= total; i++) {
        const t = (i / samples) * Math.PI * 2 + start;
        const rad = radius + jitter(rng, amp);
        points.push([
          cx + driftX * (i / total) + Math.cos(t) * rad,
          cy + driftY * (i / total) + Math.sin(t) * rad,
        ]);
      }
      return smoothPath(points, false);
    },
  );
}

/** An ellipse drawn the same way. */
export function roughEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: string,
  { wobble = 0.05, overshoot = 0.2, samples = 14 } = {},
): string {
  return memo(
    `e|${cx}|${cy}|${rx}|${ry}|${wobble}|${overshoot}|${samples}|${seed}`,
    () => {
      const rng = makeRng(seed);
      const points: Point[] = [];
      const total = samples + Math.round(samples * overshoot);
      const start = rng() * Math.PI * 2;

      for (let i = 0; i <= total; i++) {
        const t = (i / samples) * Math.PI * 2 + start;
        points.push([
          cx + Math.cos(t) * (rx + jitter(rng, rx * wobble)),
          cy + Math.sin(t) * (ry + jitter(rng, ry * wobble)),
        ]);
      }
      return smoothPath(points, false);
    },
  );
}

/**
 * A rectangle drawn as four strokes that each run past the corner. Returns one
 * path per edge so a caller can vary stroke weight edge to edge, which is what
 * stops a drawn box looking printed.
 */
export function roughRect(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  { wobble = 0.02, overshoot = 0.05, radius = 0 } = {},
): string[] {
  return memo(
    `r|${x}|${y}|${w}|${h}|${wobble}|${overshoot}|${radius}|${seed}`,
    () => {
      const rng = makeRng(seed);
      const amp = Math.min(w, h) * wobble;
      const ox = Math.min(w * overshoot, 6);
      const oy = Math.min(h * overshoot, 6);
      const inset = radius * 0.6;

      const edge = (a: Point, b: Point, over: number): string => {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const from: Point = [a[0] - ux * over * rng(), a[1] - uy * over * rng()];
        const to: Point = [b[0] + ux * over * rng(), b[1] + uy * over * rng()];
        const points: Point[] = [from];
        const steps = 3;
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          points.push([
            from[0] + (to[0] - from[0]) * t + jitter(rng, amp),
            from[1] + (to[1] - from[1]) * t + jitter(rng, amp),
          ]);
        }
        points.push(to);
        return smoothPath(points, false);
      };

      return [
        edge([x + inset, y], [x + w - inset, y], ox),
        edge([x + w, y + inset], [x + w, y + h - inset], oy),
        edge([x + w - inset, y + h], [x + inset, y + h], ox),
        edge([x, y + h - inset], [x, y + inset], oy),
      ];
    },
  );
}

/**
 * A closed, fillable rounded rectangle with a wandering edge — the drawn
 * equivalent of `<rect rx>`. Closed rather than overshooting, because this one
 * has to hold a fill; the outline passes drawn over it supply the overshoot.
 */
export function roughRoundRect(
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  seed: string,
  { wobble = 0.03 } = {},
): string {
  return memo(`rr|${x}|${y}|${w}|${h}|${radius}|${wobble}|${seed}`, () => {
    const rng = makeRng(seed);
    const rad = Math.min(radius, w / 2, h / 2);
    const amp = Math.min(w, h) * wobble;
    const points: Point[] = [];

    // Walk the outline corner by corner, sampling the arcs so the turns are as
    // uneven as the straights.
    const corners: Array<[number, number, number]> = [
      [x + w - rad, y + rad, -Math.PI / 2],
      [x + w - rad, y + h - rad, 0],
      [x + rad, y + h - rad, Math.PI / 2],
      [x + rad, y + rad, Math.PI],
    ];

    for (const [ccx, ccy, from] of corners) {
      const steps = 4;
      for (let i = 0; i <= steps; i++) {
        const t = from + (Math.PI / 2) * (i / steps);
        points.push([
          ccx + Math.cos(t) * (rad + jitter(rng, amp)),
          ccy + Math.sin(t) * (rad + jitter(rng, amp)),
        ]);
      }
      // One sample along the straight that follows, so edges wander too.
      points.push([
        ccx + Math.cos(from + Math.PI / 2) * rad + jitter(rng, amp),
        ccy + Math.sin(from + Math.PI / 2) * rad + jitter(rng, amp),
      ]);
    }
    return `${smoothPath(points, true)} Z`;
  });
}

/* ------------------------------------------------------------- hatching -- */

/**
 * Pencil hatching, computed analytically against the shape rather than clipped
 * with a `<clipPath>`.
 *
 * That is a deliberate constraint, not an optimisation: these drawings render
 * in Server Components, where `useId` is unavailable, so any clip-path id would
 * either collide across instances or force the whole illustration to become a
 * client component. Solving the intersection in maths keeps the artwork on the
 * server and keeps the markup free of generated ids.
 */
function hatchLines(
  chord: (offset: number) => [number, number] | null,
  minO: number,
  maxO: number,
  gap: number,
  angle: number,
  cx: number,
  cy: number,
  rng: () => number,
): string[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const out: string[] = [];

  for (let o = minO; o <= maxO; o += gap) {
    const span = chord(o);
    if (!span) continue;
    const [t0, t1] = span;
    // Pull the stroke in from the true edge and let each end fall short by a
    // different amount — hatching that touches the outline every time reads as
    // a fill, not as pencil.
    const pad0 = (t1 - t0) * (0.04 + rng() * 0.1);
    const pad1 = (t1 - t0) * (0.04 + rng() * 0.1);
    const a = t0 + pad0;
    const b = t1 - pad1;
    if (b - a < 1) continue;

    const oJ = o + jitter(rng, gap * 0.16);
    const p = (t: number): Point => [
      cx + cos * t - sin * oJ,
      cy + sin * t + cos * oJ,
    ];
    const start = p(a);
    const end = p(b);
    const midT = (a + b) / 2;
    const m = p(midT);
    // One control point, bowed slightly, so no two strokes are parallel twins.
    out.push(
      `M ${r(start[0])} ${r(start[1])} Q ${r(m[0] + jitter(rng, gap * 0.4))} ${r(
        m[1] + jitter(rng, gap * 0.4),
      )} ${r(end[0])} ${r(end[1])}`,
    );
  }
  return out;
}

/** Hatch strokes lying inside a circle. */
export function hatchCircle(
  cx: number,
  cy: number,
  radius: number,
  seed: string,
  { angle = -0.6, gap = 3.4, inset = 1.6 } = {},
): string[] {
  return memo(
    `hc|${cx}|${cy}|${radius}|${angle}|${gap}|${inset}|${seed}`,
    () => {
      const rng = makeRng(seed);
      const rr = Math.max(0, radius - inset);
      return hatchLines(
        (o) => {
          if (Math.abs(o) >= rr) return null;
          const half = Math.sqrt(rr * rr - o * o);
          return [-half, half];
        },
        -rr + gap * 0.5,
        rr - gap * 0.5,
        gap,
        angle,
        cx,
        cy,
        rng,
      );
    },
  );
}

/** Hatch strokes lying inside an axis-aligned rectangle. */
export function hatchRect(
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  { angle = -0.6, gap = 3.4, inset = 1.6 } = {},
): string[] {
  return memo(
    `hr|${x}|${y}|${w}|${h}|${angle}|${gap}|${inset}|${seed}`,
    () => {
      const rng = makeRng(seed);
      const x0 = x + inset;
      const y0 = y + inset;
      const x1 = x + w - inset;
      const y1 = y + h - inset;
      if (x1 <= x0 || y1 <= y0) return [];
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const hw = (x1 - x0) / 2;
      const hh = (y1 - y0) / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Clip the line (in rotated space) against the rect, Liang–Barsky style.
      const chord = (o: number): [number, number] | null => {
        let tMin = -Infinity;
        let tMax = Infinity;
        const px = -sin * o;
        const py = cos * o;
        const clip = (dir: number, base: number, lo: number, hi: number) => {
          if (Math.abs(dir) < 1e-9) return base >= lo && base <= hi;
          const ta = (lo - base) / dir;
          const tb = (hi - base) / dir;
          tMin = Math.max(tMin, Math.min(ta, tb));
          tMax = Math.min(tMax, Math.max(ta, tb));
          return true;
        };
        if (!clip(cos, px, -hw, hw)) return null;
        if (!clip(sin, py, -hh, hh)) return null;
        if (tMax - tMin < 1) return null;
        return [tMin, tMax];
      };

      const reach = Math.hypot(hw, hh);
      return hatchLines(chord, -reach, reach, gap, angle, cx, cy, rng);
    },
  );
}

/**
 * The scribbled shadow a figure sits on: three or four overlapping strokes
 * rather than a soft ellipse, because a soft ellipse is a CSS effect and this
 * page is drawn.
 */
export function scribbleShadow(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: string,
  { strokes = 4 } = {},
): string[] {
  return memo(`ss|${cx}|${cy}|${rx}|${ry}|${strokes}|${seed}`, () => {
    const rng = makeRng(seed);
    const out: string[] = [];
    for (let i = 0; i < strokes; i++) {
      const t = strokes === 1 ? 0.5 : i / (strokes - 1);
      const spread = 1 - Math.abs(t - 0.5) * 1.1;
      const y = cy - ry + t * ry * 2;
      const half = rx * spread + jitter(rng, rx * 0.09);
      const x0 = cx - half + jitter(rng, rx * 0.12);
      const x1 = cx + half + jitter(rng, rx * 0.12);
      const my = y + jitter(rng, ry * 0.35);
      out.push(
        `M ${r(x0)} ${r(y + jitter(rng, ry * 0.2))} Q ${r((x0 + x1) / 2)} ${r(
          my,
        )} ${r(x1)} ${r(y + jitter(rng, ry * 0.2))}`,
      );
    }
    return out;
  });
}

/**
 * A short annotation stroke — the ring somebody draws around the number that
 * matters. Open at one side, and carried past where it started.
 */
export function roughRing(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: string,
): string {
  return memo(`rg|${cx}|${cy}|${rx}|${ry}|${seed}`, () => {
    const rng = makeRng(seed);
    const points: Point[] = [];
    const from = -0.35 + jitter(rng, 0.2);
    const to = from + Math.PI * 2 * (0.94 + rng() * 0.16);
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = from + ((to - from) * i) / steps;
      points.push([
        cx + Math.cos(t) * (rx + jitter(rng, rx * 0.05)),
        cy + Math.sin(t) * (ry + jitter(rng, ry * 0.06)),
      ]);
    }
    return smoothPath(points, false);
  });
}
