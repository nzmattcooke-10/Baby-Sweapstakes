/**
 * Geometry for the morphing baby.
 *
 * Two rules run through all of this, and both exist because breaking them
 * looks awful:
 *
 * 1. **The head never changes size.** Weight goes into the torso, cheeks and
 *    limbs; length goes into the torso and legs. Real babies gain weight in
 *    the body, and a head that inflates or elongates with the slider stops
 *    reading as "a chubby baby" and starts reading as a medical diagram.
 *
 * 2. **The drawing stops exaggerating before the numbers do.** A slider at
 *    6 kg still reports 6 kg, but the illustration only travels ~80% of its
 *    visual range. Without this the extremes of a perfectly reasonable
 *    guessing range produce something genuinely unsettling, and people notice
 *    a cartoon that has gone wrong far more than one that is slightly
 *    understated.
 */

export const WEIGHT_MIN_G = 1500;
export const WEIGHT_MAX_G = 6000;
export const WEIGHT_DEFAULT_G = 3400;
export const WEIGHT_STEP_G = 10;

export const LENGTH_MIN_MM = 400;
export const LENGTH_MAX_MM = 600;
export const LENGTH_DEFAULT_MM = 500;
export const LENGTH_STEP_MM = 5;

/** Fraction of the visual range actually used at the numeric extremes.
 *  Widened from 0.16–0.84 so the squash-and-stretch is easy to read as the
 *  slider moves — the drawing still stops short of the raw 0–1 extremes so the
 *  ends stay charming rather than alarming (rule 2 above). */
const VISUAL_FLOOR = 0.06;
const VISUAL_CEILING = 0.94;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Normalise a value to 0..1, then compress it into the safe visual band. */
function morphT(value: number, min: number, max: number): number {
  const raw = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return lerp(VISUAL_FLOOR, VISUAL_CEILING, raw);
}

export type BabyGeometry = {
  headCx: number;
  headCy: number;
  headR: number;
  torsoTop: number;
  torsoHeight: number;
  torsoHalfWidth: number;
  torsoBottom: number;
  limbWidth: number;
  legLength: number;
  shoulderY: number;
  cheekOffset: number;
  cheekR: number;
};

export const BABY_VIEWBOX = { width: 100, height: 112 };

/**
 * Where the baby actually starts and ends along its long axis, in viewBox
 * units. The length toy needs this to park its clamps against the crown and
 * the heels — the drawn figure only fills part of the box, and the heel end
 * moves as the guess changes.
 */
export function babyExtent(
  weightGrams: number,
  lengthMm: number,
): { crown: number; heel: number } {
  const g = babyGeometry(weightGrams, lengthMm);
  return {
    crown: g.headCy - g.headR,
    heel: g.torsoBottom + g.legLength + g.limbWidth * 0.45,
  };
}

export function babyGeometry(
  weightGrams: number,
  lengthMm: number,
): BabyGeometry {
  const plump = morphT(weightGrams, WEIGHT_MIN_G, WEIGHT_MAX_G);
  const stretch = morphT(lengthMm, LENGTH_MIN_MM, LENGTH_MAX_MM);

  const torsoTop = 40;
  // Wider travel on both axes so the sliders visibly squash and stretch the
  // baby. Weight drives the torso/limb/cheek width; length drives the torso
  // height and legs. The head stays out of all of it (rule 1).
  const torsoHeight = lerp(21, 35, stretch);
  const torsoHalfWidth = lerp(8, 22, plump);

  return {
    headCx: 50,
    headCy: 26,
    headR: 14, // Fixed. Deliberately. See rule 1 above.
    torsoTop,
    torsoHeight,
    torsoHalfWidth,
    torsoBottom: torsoTop + torsoHeight,
    // Limbs stay stubby. Thick strokes read as a yoke across the shoulders
    // rather than as arms, which flattens the silhouette and hides the very
    // weight change the toy exists to show.
    limbWidth: lerp(5, 10, plump),
    legLength: lerp(13, 30, stretch),
    shoulderY: torsoTop + 6,
    cheekOffset: lerp(6.5, 9, plump),
    cheekR: lerp(2.2, 4, plump),
  };
}
