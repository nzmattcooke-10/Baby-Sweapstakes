import { describe, expect, it } from "vitest";
import {
  formatLength,
  formatTime,
  formatWeight,
  gramsToLbOz,
  inchesToMm,
  lbOzToGrams,
  mmToInches,
  skyBand,
  speakWeight,
} from "./units";

describe("weight conversion", () => {
  it("converts a typical newborn weight", () => {
    expect(gramsToLbOz(3400)).toEqual({ lb: 7, oz: 8 });
  });

  it("carries into the next pound rather than reporting 16 oz", () => {
    // 453.4g is a hair under 1lb; naive rounding yields 0lb 16oz.
    expect(gramsToLbOz(453.4)).toEqual({ lb: 1, oz: 0 });
  });

  it("round-trips through lb/oz within rounding tolerance", () => {
    for (let g = 1500; g <= 6000; g += 50) {
      const { lb, oz } = gramsToLbOz(g);
      expect(Math.abs(lbOzToGrams(lb, oz) - g)).toBeLessThan(15);
    }
  });

  it("formats in both unit systems", () => {
    expect(formatWeight(3400, "metric")).toBe("3.40 kg");
    expect(formatWeight(3400, "imperial")).toBe("7 lb 8 oz");
  });

  it("spells units out for screen readers", () => {
    expect(speakWeight(3400)).toBe("3.40 kilograms, 7 pounds 8 ounces");
  });
});

describe("length conversion", () => {
  it("converts mm to inches", () => {
    expect(mmToInches(508)).toBeCloseTo(20, 5);
    expect(inchesToMm(20)).toBe(508);
  });

  it("formats in both unit systems", () => {
    expect(formatLength(500, "metric")).toBe("50.0 cm");
    expect(formatLength(508, "imperial")).toBe("20.0 in");
  });
});

describe("time formatting", () => {
  it("handles the midnight and noon edges", () => {
    expect(formatTime(0)).toBe("12:00 am");
    expect(formatTime(720)).toBe("12:00 pm");
    expect(formatTime(1439)).toBe("11:59 pm");
  });

  it("pads minutes", () => {
    expect(formatTime(9 * 60 + 5)).toBe("9:05 am");
  });
});

describe("sky bands", () => {
  it("maps times of day to the right band", () => {
    expect(skyBand(2 * 60)).toBe("night");
    expect(skyBand(6 * 60)).toBe("dawn");
    expect(skyBand(12 * 60)).toBe("day");
    expect(skyBand(18 * 60)).toBe("dusk");
    expect(skyBand(23 * 60)).toBe("night");
  });
});
