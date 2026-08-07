import { BABY_VIEWBOX, babyGeometry } from "./morph";
import {
  hatchCircle,
  hatchRect,
  roughCircle,
  roughEllipse,
  roughRoundRect,
  scribbleShadow,
} from "@/components/zine/rough";

/**
 * One baby, reused by every toy, so the whole guessing flow feels like a single
 * world rather than six unrelated widgets.
 *
 * It is always drawn upright. The length toy rotates the whole thing a quarter
 * turn so the baby lies between its clamps — which is exactly how a newborn is
 * really measured, head against a fixed board and heel against a slider.
 *
 * The morph is driven straight off props with no animation library. React
 * re-rendering as the slider moves *is* the animation, which means it also
 * behaves correctly under prefers-reduced-motion: the shape change is content,
 * not decoration, so it should still happen — it just shouldn't spring.
 *
 * ## Why the geometry is generated
 *
 * This was flat vector clip-art until a review called it out: perfect circles,
 * one uniform stroke, flat fills. Volume now comes from pencil hatching and
 * every outline is a wandering line drawn in two passes at different weights.
 *
 * The seeds deliberately exclude weight and length. Reseeding per value would
 * redraw the wobble on every slider tick and the figure would "boil" while you
 * drag, which fights the one thing this drawing exists to show. With stable
 * seeds the hand stays still and only the body changes.
 */

/**
 * The outline is a fixed black rather than a themed variable because the baby
 * is always printed on a `.plate` — a block of paper stock pasted into the
 * page — in both the cream and the photocopied-black renditions.
 */
const INK = "#111111";
/** Outline weights. Two passes at different widths, never one even line. */
const LINE = 2.5;
const LINE_LIGHT = 1.5;

export const LYING_CROP = 24;

/**
 * `tucked` is what makes the length toy work. Rotating a baby with its arms
 * hanging at its sides just looks like a baby standing sideways; a real newborn
 * lying on its back has both arms up beside its head, and once the arms are
 * there the same drawing turned a quarter turn reads immediately as lying down.
 */
export type ArmPose = "down" | "wave" | "tucked";
export type Headwear = "none" | "bonnet" | "cap";

type Props = {
  weightGrams: number;
  lengthMm: number;
  headwear?: Headwear;
  armPose?: ArmPose;
  lying?: boolean;
  /** Configurable so the family can set it to something that feels like theirs. */
  skin?: string;
  className?: string;
  width?: number | string;
};

export function BabySvg({
  weightGrams,
  lengthMm,
  headwear = "none",
  armPose = "down",
  lying = false,
  skin = "#F2C9A6",
  className,
  width,
}: Props) {
  const g = babyGeometry(weightGrams, lengthMm);
  const seed = `${armPose}-${headwear}-${lying ? "l" : "u"}`;

  const armReach = 3;
  const leftArmEndX = g.headCx - g.torsoHalfWidth - armReach;
  const rightArmEndX = g.headCx + g.torsoHalfWidth + armReach;
  const armEndY = g.shoulderY + 18;
  const armBowX = g.torsoHalfWidth + armReach + 1.5;
  const tuckedX = (side: 1 | -1) =>
    g.headCx + side * (g.headR + g.limbWidth * 0.5 + 1);

  const legSpread = g.torsoHalfWidth * 0.45;
  const footY = g.torsoBottom + g.legLength;

  /** The limbs, as one definition stroked several times over. */
  const limbPaths = (
    <>
      <path
        d={`M ${g.headCx - legSpread} ${g.torsoBottom - 3}
            Q ${g.headCx - legSpread - 2} ${g.torsoBottom + g.legLength * 0.55}
              ${g.headCx - legSpread - 0.5} ${footY}`}
      />
      <path
        d={`M ${g.headCx + legSpread} ${g.torsoBottom - 3}
            Q ${g.headCx + legSpread + 2.6} ${g.torsoBottom + g.legLength * 0.55}
              ${g.headCx + legSpread + 0.5} ${footY}`}
      />
      {armPose === "tucked" ? (
        <path
          d={`M ${g.headCx - g.torsoHalfWidth * 0.9} ${g.shoulderY}
              Q ${g.headCx - armBowX - 4} ${g.shoulderY - 8}
                ${tuckedX(-1)} ${g.headCy + 3}`}
        />
      ) : (
        <path
          d={`M ${g.headCx - g.torsoHalfWidth * 0.9} ${g.shoulderY}
              Q ${g.headCx - armBowX} ${g.shoulderY + 9} ${leftArmEndX} ${armEndY}`}
        />
      )}
      {armPose === "down" ? (
        <path
          d={`M ${g.headCx + g.torsoHalfWidth * 0.9} ${g.shoulderY}
              Q ${g.headCx + armBowX} ${g.shoulderY + 9.6} ${rightArmEndX} ${armEndY}`}
        />
      ) : (
        <path
          d={`M ${g.headCx + g.torsoHalfWidth * 0.9} ${g.shoulderY}
              Q ${g.headCx + armBowX + 4} ${g.shoulderY - 8}
                ${tuckedX(1)} ${g.headCy + (armPose === "wave" ? 1 : 3)}`}
        />
      )}
    </>
  );

  /** Hands and feet, as data: one definition, two passes. */
  const extremities = [
    {
      key: "footL",
      cx: g.headCx - legSpread - 2,
      cy: footY + 1,
      rx: g.limbWidth * 0.62,
      ry: g.limbWidth * 0.45,
    },
    {
      key: "footR",
      cx: g.headCx + legSpread + 2,
      cy: footY + 1.4,
      rx: g.limbWidth * 0.64,
      ry: g.limbWidth * 0.44,
    },
    {
      key: "handL",
      cx: armPose === "tucked" ? tuckedX(-1) : leftArmEndX,
      cy: armPose === "tucked" ? g.headCy + 3 : armEndY,
      rx: g.limbWidth * 0.55,
      ry: g.limbWidth * 0.55,
    },
    {
      key: "handR",
      cx: armPose === "down" ? rightArmEndX : tuckedX(1),
      cy: armPose === "down" ? armEndY : g.headCy + (armPose === "wave" ? 1 : 3),
      rx: g.limbWidth * 0.57,
      ry: g.limbWidth * 0.57,
    },
  ];

  const torso = roughRoundRect(
    g.headCx - g.torsoHalfWidth,
    g.torsoTop,
    g.torsoHalfWidth * 2,
    g.torsoHeight,
    g.torsoHalfWidth * 0.55,
    `${seed}-torso`,
  );
  const head = roughCircle(g.headCx, g.headCy, g.headR, `${seed}-head`);

  // Volume, from hatching rather than from a gradient. The head is lit from the
  // upper left, so the shading sits lower right on both forms.
  const headShade = hatchCircle(
    g.headCx + g.headR * 0.44,
    g.headCy + g.headR * 0.46,
    g.headR * 0.46,
    `${seed}-headshade`,
    { angle: -0.75, gap: 3.2 },
  );
  const torsoShade = hatchRect(
    g.headCx + g.torsoHalfWidth * 0.34,
    g.torsoTop + g.torsoHeight * 0.24,
    g.torsoHalfWidth * 0.6,
    g.torsoHeight * 0.62,
    `${seed}-torsoshade`,
    { angle: -0.75, gap: 3.4 },
  );

  const shadow = scribbleShadow(
    g.headCx,
    footY + 6,
    g.torsoHalfWidth * 1.15,
    2.6,
    `${seed}-shadow`,
  );

  // Faces are asymmetric. Matching eyes are the tell that nobody drew this.
  const eyeL = roughEllipse(g.headCx - 4.6, g.headCy + 0.5, 1.6, 2, `${seed}-eyeL`, {
    wobble: 0.16,
    samples: 9,
  });
  const eyeR = roughEllipse(g.headCx + 4.7, g.headCy + 0.8, 1.45, 1.85, `${seed}-eyeR`, {
    wobble: 0.16,
    samples: 9,
  });

  // Cheeks as two or three pencil ticks, not soft pink discs.
  const cheekL = hatchCircle(
    g.headCx - g.cheekOffset,
    g.headCy + 4.5,
    Math.max(1.6, g.cheekR * 0.85),
    `${seed}-cheekL`,
    { angle: -1.05, gap: 1.5, inset: 0.3 },
  );
  const cheekR = hatchCircle(
    g.headCx + g.cheekOffset,
    g.headCy + 4.6,
    Math.max(1.6, g.cheekR * 0.85),
    `${seed}-cheekR`,
    { angle: -1.05, gap: 1.5, inset: 0.3 },
  );

  return (
    <svg
      viewBox={
        lying
          ? `0 ${LYING_CROP} ${BABY_VIEWBOX.height} ${BABY_VIEWBOX.width - LYING_CROP * 2}`
          : `0 0 ${BABY_VIEWBOX.width} ${BABY_VIEWBOX.height}`
      }
      className={className}
      width={width}
      aria-hidden="true"
      focusable="false"
    >
      <g
        transform={
          lying ? `translate(0 ${BABY_VIEWBOX.width}) rotate(-90)` : undefined
        }
      >
        {/* the ground it stands on */}
        {!lying && (
          <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.55">
            {shadow.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        )}

        {/* ---- limbs: ink underlay, skin, then a light contour ---- */}
        <g
          stroke={INK}
          strokeWidth={g.limbWidth + LINE * 2}
          strokeLinecap="round"
          fill="none"
        >
          {limbPaths}
        </g>

        {/* hands and feet, outlined under their fills */}
        <g fill={INK}>
          {extremities.map(({ cx, cy, rx, ry, key }) => (
            <path
              key={key}
              d={roughEllipse(cx, cy, rx + LINE, ry + LINE, `${seed}-${key}-o`, {
                wobble: 0.09,
                samples: 10,
              })}
            />
          ))}
        </g>

        <g stroke={skin} strokeWidth={g.limbWidth} strokeLinecap="round" fill="none">
          {limbPaths}
        </g>

        <g fill={skin}>
          {extremities.map(({ cx, cy, rx, ry, key }) => (
            <path
              key={key}
              d={roughEllipse(cx, cy, rx, ry, `${seed}-${key}`, {
                wobble: 0.09,
                samples: 10,
              })}
            />
          ))}
        </g>

        {/* neck */}
        <rect
          x={g.headCx - 4.5}
          y={g.headCy + g.headR - 4}
          width="9"
          height="10"
          rx="4"
          fill={skin}
        />

        {/* ---- torso: this is where the weight actually goes ---- */}
        <path d={torso} fill={skin} />
        <g stroke={INK} strokeWidth={LINE_LIGHT} strokeLinecap="round" fill="none" opacity="0.34">
          {torsoShade.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={torso} fill="none" stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
        <path
          d={roughRoundRect(
            g.headCx - g.torsoHalfWidth,
            g.torsoTop,
            g.torsoHalfWidth * 2,
            g.torsoHeight,
            g.torsoHalfWidth * 0.55,
            `${seed}-torso2`,
          )}
          fill="none"
          stroke={INK}
          strokeWidth={LINE_LIGHT}
          opacity="0.4"
        />

        {/* nappy */}
        <path
          d={`M ${g.headCx - g.torsoHalfWidth} ${g.torsoBottom - g.torsoHeight * 0.26}
              L ${g.headCx + g.torsoHalfWidth} ${g.torsoBottom - g.torsoHeight * 0.26}
              L ${g.headCx + g.torsoHalfWidth * 0.8} ${g.torsoBottom}
              Q ${g.headCx} ${g.torsoBottom + 3.5} ${g.headCx - g.torsoHalfWidth * 0.8} ${g.torsoBottom}
              Z`}
          fill="#FFF8EC"
          stroke={INK}
          strokeWidth={LINE * 0.8}
          strokeLinejoin="round"
        />

        {/* ---- head: fixed size, always ----
             Counter-rotated when lying so the face still looks at the viewer. */}
        <g transform={lying ? `rotate(90 ${g.headCx} ${g.headCy})` : undefined}>
          <ellipse
            cx={g.headCx - g.headR}
            cy={g.headCy + 2}
            rx="2.8"
            ry="3.4"
            fill={skin}
            stroke={INK}
            strokeWidth={LINE * 0.8}
          />
          <ellipse
            cx={g.headCx + g.headR}
            cy={g.headCy + 2.4}
            rx="2.7"
            ry="3.3"
            fill={skin}
            stroke={INK}
            strokeWidth={LINE * 0.8}
          />

          <path d={head} fill={skin} />
          <g stroke={INK} strokeWidth={LINE_LIGHT} strokeLinecap="round" fill="none" opacity="0.3">
            {headShade.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <path d={head} fill="none" stroke={INK} strokeWidth={LINE} strokeLinecap="round" />
          <path
            d={roughCircle(g.headCx, g.headCy, g.headR, `${seed}-head2`)}
            fill="none"
            stroke={INK}
            strokeWidth={LINE_LIGHT}
            strokeLinecap="round"
            opacity="0.42"
          />

          {/* a single curl, because every cartoon baby has one */}
          {headwear === "none" && (
            <path
              d={`M ${g.headCx} ${g.headCy - g.headR + 1}
                  q 0 -5 4 -5 q 3 0 2.5 3`}
              stroke={INK}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {headwear === "bonnet" && (
            <g>
              <path
                d={`M ${g.headCx - g.headR - 1.5} ${g.headCy - 1}
                    a ${g.headR + 1.5} ${g.headR + 1.5} 0 0 1 ${(g.headR + 1.5) * 2} 0 Z`}
                fill="#FF6BAE"
                stroke={INK}
                strokeWidth={LINE}
                strokeLinejoin="round"
              />
              <g stroke={INK} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.5">
                {hatchCircle(g.headCx + 3, g.headCy - 4, g.headR * 0.62, `${seed}-bonnet`, {
                  angle: -0.7,
                  gap: 2.6,
                })
                  .slice(0, 4)
                  .map((d, i) => (
                    <path key={i} d={d} />
                  ))}
              </g>
              <path
                d={`M ${g.headCx - g.headR - 1.5} ${g.headCy - 1} h ${(g.headR + 1.5) * 2}`}
                stroke={INK}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d={`M ${g.headCx - g.headR - 1} ${g.headCy} q -3 6 1 8`}
                stroke={INK}
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}

          {headwear === "cap" && (
            <g>
              <path
                d={`M ${g.headCx - g.headR - 0.5} ${g.headCy - 2}
                    a ${g.headR + 0.5} ${g.headR + 0.5} 0 0 1 ${(g.headR + 0.5) * 2} 0 Z`}
                fill="#00C7B7"
                stroke={INK}
                strokeWidth={LINE}
                strokeLinejoin="round"
              />
              <g stroke={INK} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.5">
                {hatchCircle(g.headCx + 3, g.headCy - 5, g.headR * 0.6, `${seed}-cap`, {
                  angle: -0.7,
                  gap: 2.6,
                })
                  .slice(0, 4)
                  .map((d, i) => (
                    <path key={i} d={d} />
                  ))}
              </g>
              <path
                d={`M ${g.headCx - g.headR - 2} ${g.headCy - 2} h ${(g.headR + 2) * 2}`}
                stroke={INK}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle
                cx={g.headCx}
                cy={g.headCy - g.headR - 2}
                r="2.2"
                fill="#00C7B7"
                stroke={INK}
                strokeWidth={LINE * 0.7}
              />
            </g>
          )}

          {/* cheeks — pencil ticks, the other place weight shows up */}
          <g stroke="#E0705F" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.75">
            {cheekL.map((d, i) => (
              <path key={`cl${i}`} d={d} />
            ))}
            {cheekR.map((d, i) => (
              <path key={`cr${i}`} d={d} />
            ))}
          </g>

          {/* face */}
          <path d={eyeL} fill={INK} />
          <path d={eyeR} fill={INK} />
          <path
            d={`M ${g.headCx - 3.2} ${g.headCy + 5.9} q 3.1 3.3 6.2 -0.3`}
            stroke={INK}
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </g>
    </svg>
  );
}
