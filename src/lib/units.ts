/**
 * Conversions between canonical storage units (grams, millimetres,
 * minutes-since-midnight) and the units people actually talk in.
 *
 * Every formatter has a `spoken` variant. Screen readers make a meal of
 * abbreviations — "3.4 kg" gets read as "three point four kay gee" — so the
 * aria-live regions in ToyShell announce the spoken form instead.
 */

export type Units = "metric" | "imperial";

const GRAMS_PER_OUNCE = 28.349523125;
const OUNCES_PER_POUND = 16;
const MM_PER_INCH = 25.4;

/* ---------------------------------------------------------------- weight -- */

export function gramsToLbOz(grams: number): { lb: number; oz: number } {
  const totalOunces = grams / GRAMS_PER_OUNCE;
  let lb = Math.floor(totalOunces / OUNCES_PER_POUND);
  let oz = Math.round(totalOunces - lb * OUNCES_PER_POUND);

  // Rounding 15.6oz up gives 16oz, which should read as the next pound.
  if (oz === OUNCES_PER_POUND) {
    lb += 1;
    oz = 0;
  }
  return { lb, oz };
}

export function lbOzToGrams(lb: number, oz: number): number {
  return Math.round((lb * OUNCES_PER_POUND + oz) * GRAMS_PER_OUNCE);
}

export function formatWeight(grams: number, units: Units = "metric"): string {
  if (units === "imperial") {
    const { lb, oz } = gramsToLbOz(grams);
    return `${lb} lb ${oz} oz`;
  }
  return `${(grams / 1000).toFixed(2)} kg`;
}

/** Both systems at once — the primary readout on the scale toy. */
export function formatWeightBoth(grams: number): string {
  const { lb, oz } = gramsToLbOz(grams);
  return `${(grams / 1000).toFixed(2)} kg · ${lb} lb ${oz} oz`;
}

export function speakWeight(grams: number): string {
  const kg = (grams / 1000).toFixed(2);
  const { lb, oz } = gramsToLbOz(grams);
  return `${kg} kilograms, ${lb} pounds ${oz} ounces`;
}

/* ---------------------------------------------------------------- length -- */

export function mmToInches(mm: number): number {
  return mm / MM_PER_INCH;
}

export function inchesToMm(inches: number): number {
  return Math.round(inches * MM_PER_INCH);
}

export function formatLength(mm: number, units: Units = "metric"): string {
  if (units === "imperial") return `${mmToInches(mm).toFixed(1)} in`;
  return `${(mm / 10).toFixed(1)} cm`;
}

export function formatLengthBoth(mm: number): string {
  return `${(mm / 10).toFixed(1)} cm · ${mmToInches(mm).toFixed(1)} in`;
}

export function speakLength(mm: number): string {
  return `${(mm / 10).toFixed(1)} centimetres, ${mmToInches(mm).toFixed(1)} inches`;
}

/* ------------------------------------------------------------------ time -- */

export function formatTime(minuteOfDay: number): string {
  const h24 = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  const suffix = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function speakTime(minuteOfDay: number): string {
  const h24 = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  const suffix = h24 < 12 ? "a.m." : "p.m.";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  if (m === 0) return `${h12} o'clock ${suffix}`;
  return `${h12} ${m < 10 ? `oh ${m}` : m} ${suffix}`;
}

export type SkyBand = "night" | "dawn" | "day" | "dusk";

/** Drives the sky gradient behind the sun/moon arc on the time toy. */
export function skyBand(minuteOfDay: number): SkyBand {
  const hour = minuteOfDay / 60;
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

export const SKY_BAND_LABEL: Record<SkyBand, string> = {
  night: "the dead of night",
  dawn: "around sunrise",
  day: "during the day",
  dusk: "around sunset",
};

/* ------------------------------------------------------------------ misc -- */

export function formatMoney(cents: number, currency = "NZD"): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
