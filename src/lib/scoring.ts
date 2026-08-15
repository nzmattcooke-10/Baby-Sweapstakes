import type { ScoringWeights } from "@/db/schema";
import { daysBetween } from "./window";

/**
 * Scoring is pure integer arithmetic over the canonical units, so it can be
 * unit-tested without a database and can't drift.
 *
 * Two distinctions the types deliberately preserve:
 *
 * - `null` points mean "not scorable yet" — the host hasn't entered this actual
 *   value. That is different from 0 points, and the UI must not conflate them.
 *   Results arrive in stages (date and time hours before an official weight,
 *   the name days later), so half this table is routinely null.
 * - A participant who never guessed a category scores 0 with an infinite
 *   distance, which keeps them out of the closest-guess running without
 *   special-casing them at every call site.
 */

export type CategoryKey = "date" | "weight" | "time" | "sex" | "length";

export const CATEGORY_ORDER: CategoryKey[] = [
  "date",
  "time",
  "weight",
  "length",
  "sex",
];

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  date: "Date",
  time: "Time",
  weight: "Weight",
  length: "Length",
  sex: "Boy or girl",
};

export type GuessValues = {
  birthDate: string | null;
  birthMinuteOfDay: number | null;
  weightGrams: number | null;
  lengthMm: number | null;
  sex: "boy" | "girl" | null;
};

export type ActualValues = {
  actualDate: string | null;
  actualMinuteOfDay: number | null;
  actualWeightGrams: number | null;
  actualLengthMm: number | null;
  actualSex: "boy" | "girl" | null;
};

export type CategoryScore = {
  /** null when the host hasn't entered this actual value yet. */
  points: number | null;
  /** Lower is closer. Infinity when the participant didn't guess. */
  distance: number;
};

/**
 * Case- and accent-insensitive, whitespace-collapsed. "  josé " and "JOSE"
 * are the same guess; nothing beyond that is treated as a match.
 */
export function normaliseName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Linear falloff to a floor of zero. */
function falloff(max: number, penaltyPerStep: number, steps: number): number {
  return Math.max(0, max - penaltyPerStep * steps);
}

export function scoreCategory(
  category: CategoryKey,
  guess: GuessValues,
  actual: ActualValues,
  weights: ScoringWeights,
): CategoryScore {
  switch (category) {
    case "date": {
      if (actual.actualDate === null) return { points: null, distance: Infinity };
      if (guess.birthDate === null) return { points: 0, distance: Infinity };
      const off = Math.abs(daysBetween(actual.actualDate, guess.birthDate));
      return {
        points: falloff(weights.date.max, weights.date.perDay, off),
        distance: off,
      };
    }

    case "time": {
      if (actual.actualMinuteOfDay === null)
        return { points: null, distance: Infinity };
      if (guess.birthMinuteOfDay === null)
        return { points: 0, distance: Infinity };
      const off = Math.abs(guess.birthMinuteOfDay - actual.actualMinuteOfDay);
      return {
        points: falloff(
          weights.time.max,
          weights.time.per30min,
          Math.floor(off / 30),
        ),
        distance: off,
      };
    }

    case "weight": {
      if (actual.actualWeightGrams === null)
        return { points: null, distance: Infinity };
      if (guess.weightGrams === null) return { points: 0, distance: Infinity };
      const off = Math.abs(guess.weightGrams - actual.actualWeightGrams);
      return {
        points: falloff(
          weights.weight.max,
          weights.weight.per50g,
          Math.floor(off / 50),
        ),
        distance: off,
      };
    }

    case "length": {
      if (actual.actualLengthMm === null)
        return { points: null, distance: Infinity };
      if (guess.lengthMm === null) return { points: 0, distance: Infinity };
      const off = Math.abs(guess.lengthMm - actual.actualLengthMm);
      return {
        points: falloff(
          weights.length.max,
          weights.length.per5mm,
          Math.floor(off / 5),
        ),
        distance: off,
      };
    }

    case "sex": {
      if (actual.actualSex === null) return { points: null, distance: Infinity };
      if (guess.sex === null) return { points: 0, distance: Infinity };
      const hit = guess.sex === actual.actualSex;
      return { points: hit ? weights.sex.max : 0, distance: hit ? 0 : 1 };
    }
  }
}

export type ParticipantInput = {
  participantId: string;
  guess: GuessValues;
};

export type ScoredParticipant = {
  participantId: string;
  categories: Record<CategoryKey, CategoryScore>;
  /** Sum of scorable categories only — nulls contribute nothing. */
  total: number;
  /** Standard competition ranking: ties share, then the next rank skips. */
  rank: number;
};

export type ScoreBoard = {
  participants: ScoredParticipant[];
  /** Participant ids holding the closest guess in each category. */
  closest: Record<CategoryKey, string[]>;
  /** Categories the host has entered an actual value for. */
  scoredCategories: CategoryKey[];
};

export function scoreAll(
  inputs: ParticipantInput[],
  actual: ActualValues,
  weights: ScoringWeights,
): ScoreBoard {
  const scored: ScoredParticipant[] = inputs.map((input) => {
    const categories = {} as Record<CategoryKey, CategoryScore>;
    let total = 0;

    for (const category of CATEGORY_ORDER) {
      const score = scoreCategory(category, input.guess, actual, weights);
      categories[category] = score;
      if (score.points !== null) total += score.points;
    }

    return { participantId: input.participantId, categories, total, rank: 0 };
  });

  scored.sort((a, b) => b.total - a.total);
  let lastTotal: number | null = null;
  let lastRank = 0;
  scored.forEach((p, index) => {
    if (lastTotal !== null && p.total === lastTotal) {
      p.rank = lastRank;
    } else {
      p.rank = index + 1;
      lastRank = p.rank;
      lastTotal = p.total;
    }
  });

  const closest = {} as Record<CategoryKey, string[]>;
  const scoredCategories: CategoryKey[] = [];

  for (const category of CATEGORY_ORDER) {
    const contenders = scored.filter(
      (p) =>
        p.categories[category].points !== null &&
        Number.isFinite(p.categories[category].distance) &&
        // Boy-or-girl is the one category with no "close". A wrong guess still
        // has a finite distance of 1, so without this everybody would be
        // declared closest whenever the whole family guessed the wrong way.
        (category !== "sex" || p.categories[category].distance === 0),
    );

    if (scored.some((p) => p.categories[category].points !== null)) {
      scoredCategories.push(category);
    }

    if (contenders.length === 0) {
      closest[category] = [];
      continue;
    }

    const best = Math.min(...contenders.map((p) => p.categories[category].distance));
    closest[category] = contenders
      .filter((p) => p.categories[category].distance === best)
      .map((p) => p.participantId);
  }

  return { participants: scored, closest, scoredCategories };
}
