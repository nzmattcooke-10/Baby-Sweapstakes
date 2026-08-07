/**
 * The 24 pickable characters.
 *
 * Each one carries a `label` describing what it looks like. That isn't
 * decoration — it's how somebody using a screen reader picks an avatar at all.
 * "Avatar 7" is useless; "Curly hair and round glasses" is a real choice.
 */

export type HairStyle =
  | "bald"
  | "buzz"
  | "short"
  | "bob"
  | "long"
  | "wavy"
  | "curly"
  | "afro"
  | "bun"
  | "ponytail"
  | "braids"
  | "cap";

export type Accessory =
  | "none"
  | "glasses"
  | "roundGlasses"
  | "beard"
  | "moustache"
  | "freckles"
  | "earrings";

export type AvatarDef = {
  key: string;
  label: string;
  skin: string;
  hairColor: string;
  hair: HairStyle;
  accessory: Accessory;
};

const SKIN = {
  porcelain: "#F7DFC9",
  fair: "#F0C9A4",
  olive: "#DDA87A",
  tan: "#C1855A",
  brown: "#96603A",
  deep: "#6B4227",
} as const;

const HAIR = {
  black: "#2E2A27",
  darkBrown: "#4A3222",
  brown: "#7A4E2D",
  auburn: "#9C4A2A",
  blonde: "#D9A441",
  grey: "#B0AAA4",
  white: "#E2DDD7",
  red: "#B4451F",
} as const;

export const AVATARS: AvatarDef[] = [
  { key: "a01", label: "Short dark hair", skin: SKIN.fair, hairColor: HAIR.black, hair: "short", accessory: "none" },
  { key: "a02", label: "Short dark hair with glasses", skin: SKIN.tan, hairColor: HAIR.darkBrown, hair: "short", accessory: "glasses" },
  { key: "a03", label: "Buzz cut", skin: SKIN.brown, hairColor: HAIR.black, hair: "buzz", accessory: "none" },
  { key: "a04", label: "Buzz cut with a beard", skin: SKIN.olive, hairColor: HAIR.darkBrown, hair: "buzz", accessory: "beard" },
  { key: "a05", label: "Bobbed blonde hair", skin: SKIN.porcelain, hairColor: HAIR.blonde, hair: "bob", accessory: "none" },
  { key: "a06", label: "Bobbed hair with freckles", skin: SKIN.fair, hairColor: HAIR.auburn, hair: "bob", accessory: "freckles" },
  { key: "a07", label: "Long brown hair", skin: SKIN.olive, hairColor: HAIR.brown, hair: "long", accessory: "none" },
  { key: "a08", label: "Long hair with earrings", skin: SKIN.deep, hairColor: HAIR.black, hair: "long", accessory: "earrings" },
  { key: "a09", label: "Wavy red hair", skin: SKIN.porcelain, hairColor: HAIR.red, hair: "wavy", accessory: "freckles" },
  { key: "a10", label: "Wavy grey hair with round glasses", skin: SKIN.fair, hairColor: HAIR.grey, hair: "wavy", accessory: "roundGlasses" },
  { key: "a11", label: "Curly dark hair", skin: SKIN.brown, hairColor: HAIR.black, hair: "curly", accessory: "none" },
  { key: "a12", label: "Curly hair with glasses", skin: SKIN.tan, hairColor: HAIR.darkBrown, hair: "curly", accessory: "glasses" },
  { key: "a13", label: "Afro", skin: SKIN.deep, hairColor: HAIR.black, hair: "afro", accessory: "none" },
  { key: "a14", label: "Afro with round glasses", skin: SKIN.brown, hairColor: HAIR.darkBrown, hair: "afro", accessory: "roundGlasses" },
  { key: "a15", label: "Hair in a bun", skin: SKIN.fair, hairColor: HAIR.brown, hair: "bun", accessory: "none" },
  { key: "a16", label: "Grey bun with earrings", skin: SKIN.porcelain, hairColor: HAIR.grey, hair: "bun", accessory: "earrings" },
  { key: "a17", label: "Ponytail", skin: SKIN.olive, hairColor: HAIR.black, hair: "ponytail", accessory: "none" },
  { key: "a18", label: "Blonde ponytail with freckles", skin: SKIN.porcelain, hairColor: HAIR.blonde, hair: "ponytail", accessory: "freckles" },
  { key: "a19", label: "Braided hair", skin: SKIN.brown, hairColor: HAIR.black, hair: "braids", accessory: "none" },
  { key: "a20", label: "Braided hair with glasses", skin: SKIN.deep, hairColor: HAIR.darkBrown, hair: "braids", accessory: "glasses" },
  { key: "a21", label: "Baseball cap", skin: SKIN.tan, hairColor: HAIR.brown, hair: "cap", accessory: "none" },
  { key: "a22", label: "Baseball cap with a moustache", skin: SKIN.fair, hairColor: HAIR.darkBrown, hair: "cap", accessory: "moustache" },
  { key: "a23", label: "Bald with a white beard", skin: SKIN.fair, hairColor: HAIR.white, hair: "bald", accessory: "beard" },
  { key: "a24", label: "Bald with round glasses", skin: SKIN.olive, hairColor: HAIR.grey, hair: "bald", accessory: "roundGlasses" },
];

export const AVATAR_BY_KEY = new Map(AVATARS.map((a) => [a.key, a]));

export function getAvatar(key: string): AvatarDef {
  return AVATAR_BY_KEY.get(key) ?? AVATARS[0];
}

/**
 * Accent discs.
 *
 * These used to be eight independent hues. The redesign's colour law is ink
 * plus three highlighters and nothing else, and eight arbitrary colours on the
 * board made the avatars the loudest thing on a page that had already spent its
 * colour — so the eight choices are now four inks crossed with two pencil
 * treatments. Two people are told apart by what is drawn on their disc, not by
 * inventing a ninth colour.
 *
 * Every disc carries a black outline and a black-featured face, so all four
 * fills clear contrast against both renditions of the page. Colour is never the
 * only signal regardless: an avatar always sits beside its owner's name.
 */
export type AccentPattern = "plain" | "hatch";

export type AccentDef = {
  key: string;
  label: string;
  hex: string;
  pattern: AccentPattern;
};

export const ACCENTS: AccentDef[] = [
  { key: "yellow", label: "Yellow", hex: "#FFE34D", pattern: "plain" },
  { key: "pink", label: "Pink", hex: "#FF6BAE", pattern: "plain" },
  { key: "teal", label: "Teal", hex: "#00C7B7", pattern: "plain" },
  { key: "paper", label: "Plain paper", hex: "#FFF8EC", pattern: "plain" },
  { key: "yellow-hatch", label: "Yellow, shaded", hex: "#FFE34D", pattern: "hatch" },
  { key: "pink-hatch", label: "Pink, shaded", hex: "#FF6BAE", pattern: "hatch" },
  { key: "teal-hatch", label: "Teal, shaded", hex: "#00C7B7", pattern: "hatch" },
  { key: "paper-hatch", label: "Paper, shaded", hex: "#FFF8EC", pattern: "hatch" },
];

/**
 * Participants store a bare hex, and the pre-redesign palette is still sitting
 * in every existing row. Rather than migrate the column, each legacy hue is
 * folded into the law here, so old rows keep a stable identity and no avatar on
 * the board can render a colour the law does not allow.
 */
const LEGACY: Record<string, string> = {
  "#B4324F": "pink",
  "#9A5B00": "yellow",
  "#5C6B1F": "yellow-hatch",
  "#1F6B4A": "teal",
  "#0F6A70": "teal-hatch",
  "#1C5A9E": "paper-hatch",
  "#4A46A8": "pink-hatch",
  "#7A3480": "paper",
};

/** The disc to actually draw for a stored accent value. Never returns null. */
export function resolveAccent(stored: string): AccentDef {
  const legacyKey = LEGACY[stored?.toUpperCase?.() ?? ""];
  if (legacyKey) {
    const found = ACCENTS.find((a) => a.key === legacyKey);
    if (found) return found;
  }
  // A stored value from the current set: first match on hex wins for `plain`,
  // so the key is what disambiguates a shaded disc from its plain twin.
  return (
    ACCENTS.find((a) => a.key === stored) ??
    ACCENTS.find((a) => a.hex.toUpperCase() === stored?.toUpperCase?.()) ??
    ACCENTS[0]
  );
}

export const ACCENT_HEXES = ACCENTS.map((a) => a.key);

export function accentLabel(stored: string): string {
  return resolveAccent(stored).label;
}
