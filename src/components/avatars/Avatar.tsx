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
/** Soft pink for animal noses and inner ears — the one hue the faces borrow. */
const PINK = "#E38DA6";

type Props = {
  avatarKey: string;
  accent: string;
  /** An uploaded photo (data URL). When set it replaces the drawn face. */
  photo?: string | null;
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

/**
 * Everything that sits BEHIND the face fill: the species' ears, plus a few
 * short fur strokes around the head. Drawing the texture here — before the
 * opaque face is laid down — is deliberate: it tucks under the face and only
 * shows at the silhouette, so the scribble frames the character instead of
 * being scrawled across its features.
 */
function AnimalBack({ def }: { def: AvatarDef }) {
  const fur = def.skin;
  const mark = def.hairColor;
  const ear = { stroke: INK, strokeWidth: LINE, strokeLinejoin: "round" as const };

  let ears: React.ReactNode = null;
  switch (def.animal) {
    case "cat":
      ears = (
        <>
          <path d="M19 24 L24 9 L31 22 Z" fill={fur} {...ear} />
          <path d="M45 24 L40 9 L33 22 Z" fill={fur} {...ear} />
          <path d="M22.5 21.5 L25 13.5 L28.5 21 Z" fill={PINK} />
          <path d="M41.5 21.5 L39 13.5 L35.5 21 Z" fill={PINK} />
        </>
      );
      break;
    case "dog":
      ears = (
        <>
          <path d="M17 27 C10 30 10 43 16 47 C21 45 21.5 36 22.5 30 Z" fill={mark} {...ear} />
          <path d="M47 27 C54 30 54 43 48 47 C43 45 42.5 36 41.5 30 Z" fill={mark} {...ear} />
        </>
      );
      break;
    case "bear":
      ears = (
        <>
          <circle cx="20" cy="19" r="6.6" fill={fur} stroke={INK} strokeWidth={LINE} />
          <circle cx="44" cy="19" r="6.6" fill={fur} stroke={INK} strokeWidth={LINE} />
          <circle cx="20" cy="19.5" r="3" fill={mark} />
          <circle cx="44" cy="19.5" r="3" fill={mark} />
        </>
      );
      break;
    case "bunny":
      ears = (
        <>
          <path d="M25 22 C22.5 8 25.5 2.5 27.5 2.5 C29.5 2.5 30 9 29.5 22 Z" fill={fur} {...ear} />
          <path d="M39 22 C41.5 8 38.5 2.5 36.5 2.5 C34.5 2.5 34 9 34.5 22 Z" fill={fur} {...ear} />
          <path d="M26.3 20 C25 10.5 27 6 27.7 6 C28.4 6 29 11 28.4 20 Z" fill={PINK} />
          <path d="M37.7 20 C39 10.5 37 6 36.3 6 C35.6 6 35 11 35.6 20 Z" fill={PINK} />
        </>
      );
      break;
    case "fox":
      ears = (
        <>
          <path d="M18 25 L21 7 L31 21 Z" fill={fur} {...ear} />
          <path d="M46 25 L43 7 L33 21 Z" fill={fur} {...ear} />
          <path d="M21 8 L23.5 16 L27 19 Z" fill={mark} />
          <path d="M43 8 L40.5 16 L37 19 Z" fill={mark} />
        </>
      );
      break;
    case "panda":
      ears = (
        <>
          <circle cx="20" cy="18.5" r="6.6" fill={mark} stroke={INK} strokeWidth={LINE} />
          <circle cx="44" cy="18.5" r="6.6" fill={mark} stroke={INK} strokeWidth={LINE} />
        </>
      );
      break;
  }

  return (
    <>
      {ears}
      {/* Fur at the silhouette — mostly hidden by the face, peeking at the edges. */}
      <g stroke={INK} strokeWidth={LINE * 0.7} strokeLinecap="round" opacity="0.5">
        <path d="M18.5 30 l-3.2 -1.4" />
        <path d="M17.5 36 l-3.4 0.2" />
        <path d="M18.5 42 l-3.2 1.7" />
        <path d="M45.5 30 l3.2 -1.4" />
        <path d="M46.5 36 l3.4 0.2" />
        <path d="M45.5 42 l3.2 1.7" />
        <path d="M24 48 l-1.4 3.2" />
        <path d="M40 48 l1.4 3.2" />
      </g>
    </>
  );
}

/**
 * Everything that sits ON the face: the muzzle, nose, mouth, whiskers and the
 * eyes. Panda is the one that can't reuse the shared dark eyes — its black
 * patches would swallow them — so it draws its own.
 */
function AnimalFront({ def, seed }: { def: AvatarDef; seed: string }) {
  const mark = def.hairColor;
  const mouth = (cx: number, top: number) => (
    <path
      d={`M${cx} ${top} L${cx} ${top + 2.2} M${cx} ${top + 2.2} C${cx - 2.4} ${top + 3.8} ${cx - 4} ${top + 2.8} ${cx - 4.6} ${top + 1.8} M${cx} ${top + 2.2} C${cx + 2.4} ${top + 3.8} ${cx + 4} ${top + 2.8} ${cx + 4.6} ${top + 1.8}`}
      stroke={INK}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );

  const eye = (cx: number, cy: number, k: string) => (
    <path
      d={roughEllipse(cx, cy, 1.85, 2.35, `${seed}-${k}`, { wobble: 0.18, samples: 9 })}
      fill={INK}
    />
  );

  switch (def.animal) {
    case "cat":
      return (
        <>
          {eye(26.5, 34, "eyeL")}
          {eye(37.6, 34.2, "eyeR")}
          <path d="M29.8 37.4 L34.2 37.4 L32 40 Z" fill={PINK} stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
          {mouth(32, 40)}
          <g stroke={INK} strokeWidth="0.85" strokeLinecap="round" opacity="0.65">
            <path d="M23 38 L14.5 36.5" />
            <path d="M23 40 L14.5 41.5" />
            <path d="M41 38 L49.5 36.5" />
            <path d="M41 40 L49.5 41.5" />
          </g>
        </>
      );
    case "dog":
      return (
        <>
          {eye(26.5, 34, "eyeL")}
          {eye(37.6, 34.2, "eyeR")}
          <ellipse cx="32" cy="42" rx="9" ry="7" fill="#F0E4D2" stroke={INK} strokeWidth="0.9" />
          <ellipse cx="32" cy="39" rx="3.1" ry="2.4" fill={INK} />
          {mouth(32, 41)}
        </>
      );
    case "bear":
      return (
        <>
          {eye(26.5, 33.6, "eyeL")}
          {eye(37.6, 33.8, "eyeR")}
          <ellipse cx="32" cy="41.5" rx="8" ry="6.5" fill="#D9BE9C" stroke={INK} strokeWidth="0.9" />
          <ellipse cx="32" cy="38.6" rx="3.2" ry="2.5" fill={INK} />
          {mouth(32, 41)}
        </>
      );
    case "bunny":
      return (
        <>
          {eye(26.5, 34, "eyeL")}
          {eye(37.6, 34.2, "eyeR")}
          <path d="M30.4 38 L33.6 38 L32 40 Z" fill={PINK} stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
          {mouth(32, 40)}
          <g fill="#FFFFFF" stroke={INK} strokeWidth="0.6">
            <rect x="30.55" y="42.4" width="1.5" height="2.6" rx="0.5" />
            <rect x="32.15" y="42.4" width="1.5" height="2.6" rx="0.5" />
          </g>
        </>
      );
    case "fox":
      return (
        <>
          {/* White snout stripe up the middle of the face. */}
          <path d="M32 32 C27.5 39 27 46 32 49.5 C37 46 36.5 39 32 32 Z" fill="#F6F0E7" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
          {eye(26.5, 33.8, "eyeL")}
          {eye(37.6, 34, "eyeR")}
          <ellipse cx="32" cy="41" rx="2.7" ry="2.1" fill={INK} />
          {mouth(32, 42.5)}
        </>
      );
    case "panda":
      return (
        <>
          <ellipse cx="26" cy="34" rx="4.3" ry="5.6" fill={mark} transform="rotate(20 26 34)" />
          <ellipse cx="38" cy="34" rx="4.3" ry="5.6" fill={mark} transform="rotate(-20 38 34)" />
          <circle cx="26" cy="34.4" r="1.7" fill="#FFFFFF" />
          <circle cx="38" cy="34.6" r="1.7" fill="#FFFFFF" />
          <circle cx="26.2" cy="34.6" r="1.15" fill={INK} />
          <circle cx="37.8" cy="34.8" r="1.15" fill={INK} />
          <ellipse cx="32" cy="39" rx="2.9" ry="2.3" fill={mark} />
          {mouth(32, 41)}
        </>
      );
    default:
      return null;
  }
}

export function Avatar({
  avatarKey,
  accent,
  photo,
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

  // An uploaded photo replaces the whole drawn face. It's clipped to a disc
  // just inside the ring, so the accent colour still frames it as a border and
  // the hand-drawn edge stays — a photo reads as the same object as the drawn
  // avatars, not a foreign rectangle dropped onto the board.
  if (photo) {
    const clipId = `ph-${seed}`;
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
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="25.5" />
        </clipPath>
        <path d={ring} fill={disc.hex} />
        <image
          href={photo}
          x="6.5"
          y="6.5"
          width="51"
          height="51"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
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
      </svg>
    );
  }

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

      {def.animal ? (
        <>
          {/* Ears and fur go behind the face; the face is laid down opaque; the
              muzzle, nose and eyes go on top. The scribble never fronts the
              features. */}
          <g stroke={INK} strokeWidth={LINE} strokeLinejoin="round" fill="none">
            <AnimalBack def={def} />
          </g>
          <path d={face} fill={def.skin} />
          <path
            d={face}
            fill="none"
            stroke={INK}
            strokeWidth={LINE}
            strokeLinecap="round"
          />
          <AnimalFront def={def} seed={seed} />
        </>
      ) : (
        <>
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

          {/* Volume under the jaw, from pencil rather than from a gradient.
              Drawn before the face fill so it sits *behind* the face: the
              pencil reads along the neck and jawline instead of being scribbled
              across the cheek. */}
          <g stroke={INK} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.34">
            {hatchCircle(37, 40, 8.5, `${seed}-jaw`, { angle: -0.7, gap: 2.6 }).map(
              (d, i) => (
                <path key={i} d={d} />
              ),
            )}
          </g>

          <path d={face} fill={def.skin} />
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
        </>
      )}

      <Accessory def={def} />
    </svg>
  );
}
