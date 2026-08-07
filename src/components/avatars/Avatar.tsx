import {
  hatchCircle,
  hatchRect,
  roughCircle,
  roughEllipse,
  roughRoundRect,
} from "@/components/zine/rough";
import { getAvatar, resolveAccent, type AvatarDef } from "./avatar-set";

/**
 * A flat portrait built from primitives. Hair is split into a layer behind the
 * head and a layer in front of it, which is what lets an afro sit *around* a
 * face while a fringe sits *on* it, without a separate drawing per character.
 *
 * The SVG is aria-hidden by default. Everywhere an avatar appears it sits
 * beside the person's actual name, and a screen reader announcing
 * "curly hair, glasses" before every single name would be noise. The picker
 * passes `title` so the descriptions are available exactly where they're
 * needed — when you're choosing one.
 */

/**
 * Outlines are a fixed black rather than a themed variable: an avatar is always
 * drawn on its own saturated accent disc, which stays the same colour in both
 * renditions, so the line that describes it does too.
 */
const INK = "#111111";
/** Outline weight, matched to the icon set and the baby illustration. */
const LINE = 1.9;

type Props = {
  avatarKey: string;
  accent: string;
  size?: number;
  /** Accessible name. Omit to render decoratively (the default). */
  title?: string;
  className?: string;
};

function HairBack({ def }: { def: AvatarDef }) {
  const c = def.hairColor;
  switch (def.hair) {
    case "bald":
      return null;
    case "buzz":
      return <ellipse cx="32" cy="28" rx="15" ry="14" fill={c} />;
    case "short":
      return <ellipse cx="32" cy="27" rx="15.5" ry="14.5" fill={c} />;
    case "bob":
      return (
        <path
          d="M16 34 C16 21 23 16 32 16 C41 16 48 21 48 34 L48 47 C48 49 46 50 44 49 L44 34 C44 26 39 22 32 22 C25 22 20 26 20 34 L20 49 C18 50 16 49 16 47 Z"
          fill={c}
        />
      );
    case "long":
      return (
        <path
          d="M15 34 C15 20 22 15 32 15 C42 15 49 20 49 34 L49 56 C49 58 47 59 45 58 L45 34 C45 25 39 21 32 21 C25 21 19 25 19 34 L19 58 C17 59 15 58 15 56 Z"
          fill={c}
        />
      );
    case "wavy":
      return (
        <path
          d="M15 34 C15 20 22 15 32 15 C42 15 49 20 49 34 L49 48 C47 51 45 45 43 48 C41 51 39 45 37 47 L37 34 C37 27 35 22 32 22 C29 22 27 27 27 34 L27 47 C25 45 23 51 21 48 C19 45 17 51 15 48 Z"
          fill={c}
        />
      );
    case "curly":
      return (
        <g fill={c}>
          <circle cx="20" cy="26" r="7" />
          <circle cx="27" cy="20" r="7.5" />
          <circle cx="36" cy="19" r="7.5" />
          <circle cx="44" cy="26" r="7" />
          <circle cx="17" cy="34" r="5.5" />
          <circle cx="47" cy="34" r="5.5" />
        </g>
      );
    case "afro":
      return <circle cx="32" cy="28" r="19" fill={c} />;
    case "bun":
      return (
        <g fill={c}>
          <circle cx="32" cy="13" r="6.5" />
          <ellipse cx="32" cy="28" rx="15" ry="14" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={c}>
          <ellipse cx="48" cy="34" rx="5.5" ry="9" />
          <ellipse cx="32" cy="28" rx="15" ry="14" />
        </g>
      );
    case "braids":
      return (
        <g fill={c}>
          <ellipse cx="17" cy="45" rx="4" ry="9" />
          <ellipse cx="47" cy="45" rx="4" ry="9" />
          <ellipse cx="32" cy="28" rx="15" ry="14" />
        </g>
      );
    case "cap":
      return <ellipse cx="32" cy="30" rx="14.5" ry="12" fill={c} />;
  }
}

function HairFront({ def }: { def: AvatarDef }) {
  const c = def.hairColor;
  switch (def.hair) {
    case "short":
      // A side part swept across the forehead.
      return (
        <path
          d="M18 27 C21 19 27 16 33 16 C40 16 45 19 47 25 C42 22 36 23 31 26 C27 28 22 29 18 27 Z"
          fill={c}
        />
      );
    case "bob":
    case "long":
    case "wavy":
      return (
        <path
          d="M19 26 C23 19 28 17 32 17 C36 17 41 19 45 26 C40 23 36 22 32 22 C28 22 24 23 19 26 Z"
          fill={c}
        />
      );
    case "cap":
      return (
        <g>
          <path
            d="M17 31 C17 21 24 16 32 16 C40 16 47 21 47 31 Z"
            fill="#1C4E8A"
          />
          <path
            d="M17 31 C13 31 10 33 10 35 L47 35 C47 33 44 31 40 31 Z"
            fill="#16406F"
          />
        </g>
      );
    default:
      return null;
  }
}

function Accessory({ def }: { def: AvatarDef }) {
  switch (def.accessory) {
    case "glasses":
      return (
        <g stroke={INK} strokeWidth="1.4" fill="none">
          <rect x="21" y="30" width="11" height="8.5" rx="2.5" />
          <rect x="34" y="30" width="11" height="8.5" rx="2.5" />
          <path d="M32 34 L34 34" />
        </g>
      );
    case "roundGlasses":
      return (
        <g stroke={INK} strokeWidth="1.4" fill="none">
          <circle cx="26" cy="34" r="5.2" />
          <circle cx="38" cy="34" r="5.2" />
          <path d="M31.2 34 L32.8 34" />
        </g>
      );
    case "moustache":
      return (
        <path
          d="M26 41.5 C28 40 30.5 40.5 32 41.5 C33.5 40.5 36 40 38 41.5 C36 43.5 33.5 43 32 42.5 C30.5 43 28 43.5 26 41.5 Z"
          fill={def.hairColor}
        />
      );
    case "freckles":
      return (
        <g fill={INK} opacity="0.32">
          <circle cx="23" cy="38" r="0.9" />
          <circle cx="26" cy="40" r="0.9" />
          <circle cx="20.5" cy="40.5" r="0.9" />
          <circle cx="41" cy="38" r="0.9" />
          <circle cx="38" cy="40" r="0.9" />
          <circle cx="43.5" cy="40.5" r="0.9" />
        </g>
      );
    case "earrings":
      return (
        <g fill="#E8B93C">
          <circle cx="17" cy="41" r="2.2" />
          <circle cx="47" cy="41" r="2.2" />
        </g>
      );
    case "none":
      return null;
  }
}

export function Avatar({
  avatarKey,
  accent,
  size = 64,
  title,
  className,
}: Props) {
  const def = getAvatar(avatarKey);
  const disc = resolveAccent(accent);
  const decorative = !title;

  // Seeded on the character, not on the instance: the same person's face is the
  // same drawing everywhere it appears on the board.
  const seed = `${avatarKey}-${disc.key}`;
  const ring = roughCircle(32, 32, 30.4, `${seed}-disc`, { wobble: 0.022 });
  const ring2 = roughCircle(32, 32, 30.4, `${seed}-disc2`, { wobble: 0.03 });
  const face = roughEllipse(32, 34, 14, 16, `${seed}-face`, { wobble: 0.035 });

  /**
   * The shaded half of the palette has to stay legible at plot size.
   *
   * The board packs these at ~32px, and the first attempt used the same fine
   * hatch at every size — which vanished, leaving five indistinguishable pink
   * discs on one axis. Small avatars get a few deliberately bold strokes
   * instead: at a glance a shaded disc reads as *striped*, which is the whole
   * job. Large avatars keep the fine pencil hatch, where it reads as shading.
   */
  const small = size < 40;
  const shading =
    disc.pattern === "hatch"
      ? hatchCircle(32, 32, 30, `${seed}-shade`, {
          angle: -0.7,
          gap: small ? 9.5 : 4.6,
          inset: small ? 3.5 : 2.4,
        })
      : [];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={title}
    >
      {/* The disc, drawn rather than struck: two passes at different weights so
          the edge reads as a line somebody made. */}
      <path d={ring} fill={disc.hex} />
      {shading.length > 0 && (
        <g
          stroke={INK}
          strokeWidth={small ? 3.2 : 1.1}
          strokeLinecap="round"
          fill="none"
          opacity={small ? 0.62 : 0.34}
        >
          {shading.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      )}
      <path
        d={ring}
        fill="none"
        stroke={INK}
        strokeWidth={LINE}
        strokeLinecap="round"
      />
      <path
        d={ring2}
        fill="none"
        stroke={INK}
        strokeWidth={LINE * 0.6}
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* Shoulders.
          Kept inside the disc: the old path ran to the corners of the 64x64
          box, which spilled past the circle as two grey wings. Harmless while
          the disc had no edge; obvious once it was outlined.

          Hatched rather than washed. A flat black fill at 22% is exactly the
          "volume from a fill" that this drawing system exists to refuse, and it
          was the last one left in the set. */}
      <g
        stroke={INK}
        strokeWidth={small ? 2 : 1.2}
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      >
        {hatchRect(8, 48, 48, 13, `${seed}-shoulders`, {
          angle: -0.5,
          gap: small ? 5 : 3,
          inset: 0.5,
        }).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path
        d="M6 47 C12 58 22 62 32 62 C42 62 52 58 58 47"
        fill="none"
        stroke={INK}
        strokeWidth={LINE}
        strokeLinecap="round"
      />
      <path
        d={roughRoundRect(27.5, 40, 9, 10, 4, `${seed}-neck`, { wobble: 0.06 })}
        fill={def.skin}
      />

      {/* Hair is outlined as a group. On the curly and braided styles this
          also draws the seams between the individual curls, which is what a
          hand would have done anyway. */}
      <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <HairBack def={def} />
      </g>

      {/* Ears, deliberately not a matched pair — and drawn, not struck. */}
      {[
        { cx: 18, cy: 36, rx: 3.4, ry: 4, k: "earL" },
        { cx: 46, cy: 36.6, rx: 3.2, ry: 3.8, k: "earR" },
      ].map((e) => (
        <path
          key={e.k}
          d={roughEllipse(e.cx, e.cy, e.rx, e.ry, `${seed}-${e.k}`, {
            wobble: 0.12,
            samples: 9,
          })}
          fill={def.skin}
          stroke={INK}
          strokeWidth={LINE * 0.8}
        />
      ))}

      <path d={face} fill={def.skin} />
      {/* Volume under the jaw, from pencil rather than from a gradient. */}
      <g stroke={INK} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.34">
        {hatchCircle(37, 40, 8.5, `${seed}-jaw`, { angle: -0.7, gap: 2.6 }).map(
          (d, i) => (
            <path key={i} d={d} />
          ),
        )}
      </g>
      <path
        d={face}
        fill="none"
        stroke={INK}
        strokeWidth={LINE}
        strokeLinecap="round"
      />

      <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
        <HairFront def={def} />
      </g>

      {/* Beard sits under the features — drawn after them it would swallow
          the mouth, which is not the look anyone is going for. */}
      {def.accessory === "beard" && (
        <path
          d="M18 36 C18 48 24 52 32 52 C40 52 46 48 46 36 C44 44 39 46 32 46 C25 46 20 44 18 36 Z"
          fill={def.hairColor}
          stroke={INK}
          strokeWidth={LINE}
          strokeLinejoin="round"
        />
      )}

      {/* Eyes are drawn, and drawn eyes are never a matched pair. */}
      <path
        d={roughEllipse(26.5, 34, 1.9, 2.4, `${seed}-eyeL`, {
          wobble: 0.18,
          samples: 9,
        })}
        fill={INK}
      />
      <path
        d={roughEllipse(37.6, 34.4, 1.75, 2.25, `${seed}-eyeR`, {
          wobble: 0.18,
          samples: 9,
        })}
        fill={INK}
      />
      <path
        d="M27 41.5 Q32.4 45.8 37 41.2"
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      <Accessory def={def} />
    </svg>
  );
}
