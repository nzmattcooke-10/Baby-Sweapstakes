import { describe, expect, it } from "vitest";
import {
  hatchCircle,
  roughCircle,
  roughEllipse,
} from "@/components/zine/rough";

/**
 * The generators are memoised to keep the board's repeated avatar renders off
 * the free-tier Worker's CPU budget (Error 1102). These tests pin the two
 * properties that memoisation must preserve: identical inputs stay identical
 * (so the cache is correct and there's no hydration mismatch), and any changed
 * input — seed, geometry, or an option that alters the drawing — produces
 * different output rather than a stale cache hit.
 */
describe("rough geometry memoisation", () => {
  it("returns identical output for identical inputs", () => {
    const a = roughCircle(32, 32, 30.4, "a01-yellow-disc");
    const b = roughCircle(32, 32, 30.4, "a01-yellow-disc");
    expect(b).toBe(a);
  });

  it("varies output when the seed changes", () => {
    const a = roughCircle(32, 32, 30.4, "a01-yellow-disc");
    const b = roughCircle(32, 32, 30.4, "a02-yellow-disc");
    expect(b).not.toBe(a);
  });

  it("varies output when the geometry changes", () => {
    const a = roughEllipse(32, 34, 14, 16, "seed");
    const b = roughEllipse(32, 34, 14, 17, "seed");
    expect(b).not.toBe(a);
  });

  it("keys hatching on its options, not the seed alone", () => {
    // Small vs large avatars share a seed but differ only by gap/inset — the
    // cache must not hand a small avatar the large one's shading.
    const small = hatchCircle(32, 32, 30, "seed", { gap: 9.5, inset: 3.5 });
    const large = hatchCircle(32, 32, 30, "seed", { gap: 4.6, inset: 2.4 });
    expect(large).not.toEqual(small);
  });
});
