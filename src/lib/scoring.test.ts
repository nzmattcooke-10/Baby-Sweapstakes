import { describe, expect, it } from "vitest";
import { DEFAULT_SCORING_WEIGHTS as W } from "@/db/schema";
import {
  normaliseName,
  scoreAll,
  scoreCategory,
  type ActualValues,
  type GuessValues,
} from "./scoring";

const perfectGuess: GuessValues = {
  birthDate: "2026-08-15",
  birthMinuteOfDay: 9 * 60,
  weightGrams: 3400,
  lengthMm: 500,
  sex: "girl",
  firstName: "Ava",
};

const fullActual: ActualValues = {
  actualDate: "2026-08-15",
  actualMinuteOfDay: 9 * 60,
  actualWeightGrams: 3400,
  actualLengthMm: 500,
  actualSex: "girl",
  actualName: "Ava",
};

const emptyActual: ActualValues = {
  actualDate: null,
  actualMinuteOfDay: null,
  actualWeightGrams: null,
  actualLengthMm: null,
  actualSex: null,
  actualName: null,
};

describe("name normalisation", () => {
  it("ignores case, accents and surrounding whitespace", () => {
    expect(normaliseName("  José ")).toBe("jose");
    expect(normaliseName("AVA")).toBe("ava");
    expect(normaliseName("Mary  Jane")).toBe("mary jane");
  });

  it("does not treat near-misses as matches", () => {
    expect(normaliseName("Isabelle")).not.toBe(normaliseName("Isabella"));
  });
});

describe("scoreCategory", () => {
  it("awards the maximum for an exact hit in every category", () => {
    expect(scoreCategory("date", perfectGuess, fullActual, W).points).toBe(30);
    expect(scoreCategory("time", perfectGuess, fullActual, W).points).toBe(15);
    expect(scoreCategory("weight", perfectGuess, fullActual, W).points).toBe(25);
    expect(scoreCategory("length", perfectGuess, fullActual, W).points).toBe(10);
    expect(scoreCategory("sex", perfectGuess, fullActual, W).points).toBe(10);
    expect(scoreCategory("name", perfectGuess, fullActual, W).points).toBe(20);
  });

  it("falls off linearly with distance", () => {
    const twoDaysLate = { ...perfectGuess, birthDate: "2026-08-17" };
    expect(scoreCategory("date", twoDaysLate, fullActual, W).points).toBe(20);

    const heavier = { ...perfectGuess, weightGrams: 3600 }; // 200g = 4 steps
    expect(scoreCategory("weight", heavier, fullActual, W).points).toBe(21);

    const later = { ...perfectGuess, birthMinuteOfDay: 11 * 60 }; // 120min = 4 steps
    expect(scoreCategory("time", later, fullActual, W).points).toBe(11);
  });

  it("floors at zero rather than going negative", () => {
    const wayOff = { ...perfectGuess, birthDate: "2026-09-30" };
    expect(scoreCategory("date", wayOff, fullActual, W).points).toBe(0);
  });

  it("is symmetric — early and late are penalised the same", () => {
    const early = { ...perfectGuess, birthDate: "2026-08-12" };
    const late = { ...perfectGuess, birthDate: "2026-08-18" };
    expect(scoreCategory("date", early, fullActual, W).points).toBe(
      scoreCategory("date", late, fullActual, W).points,
    );
  });

  it("returns null — not zero — when the host has not entered the actual", () => {
    for (const c of ["date", "time", "weight", "length", "sex", "name"] as const) {
      expect(scoreCategory(c, perfectGuess, emptyActual, W).points).toBeNull();
    }
  });

  it("scores zero when the participant never guessed the category", () => {
    const noWeight = { ...perfectGuess, weightGrams: null };
    const score = scoreCategory("weight", noWeight, fullActual, W);
    expect(score.points).toBe(0);
    expect(score.distance).toBe(Infinity);
  });

  it("does not credit a near-miss name", () => {
    const close = { ...perfectGuess, firstName: "Avaa" };
    expect(scoreCategory("name", close, fullActual, W).points).toBe(0);
  });
});

describe("scoreAll", () => {
  const inputs = [
    { participantId: "perfect", guess: perfectGuess },
    {
      participantId: "closeish",
      guess: { ...perfectGuess, birthDate: "2026-08-16", firstName: "Mia" },
    },
    {
      participantId: "wayOff",
      guess: {
        birthDate: "2026-08-29",
        birthMinuteOfDay: 23 * 60,
        weightGrams: 4500,
        lengthMm: 560,
        sex: "boy" as const,
        firstName: "Rex",
      },
    },
  ];

  it("ranks by total, best first", () => {
    const board = scoreAll(inputs, fullActual, W);
    expect(board.participants[0].participantId).toBe("perfect");
    expect(board.participants[0].total).toBe(110);
    expect(board.participants[0].rank).toBe(1);
    expect(board.participants.at(-1)?.participantId).toBe("wayOff");
  });

  it("shares a rank on a tie and skips the next", () => {
    const twins = [
      { participantId: "a", guess: perfectGuess },
      { participantId: "b", guess: perfectGuess },
      {
        participantId: "c",
        guess: { ...perfectGuess, birthDate: "2026-08-20" },
      },
    ];
    const board = scoreAll(twins, fullActual, W);
    expect(board.participants[0].rank).toBe(1);
    expect(board.participants[1].rank).toBe(1);
    expect(board.participants[2].rank).toBe(3);
  });

  it("names the closest guess in each category", () => {
    const board = scoreAll(inputs, fullActual, W);
    expect(board.closest.date).toEqual(["perfect"]);
    expect(board.closest.name).toEqual(["perfect"]);
    // All three guessed 3400g except wayOff, so two tie on weight.
    expect(board.closest.weight.sort()).toEqual(["closeish", "perfect"]);
  });

  it("only counts categories the host has actually entered", () => {
    const partial: ActualValues = {
      ...emptyActual,
      actualDate: "2026-08-15",
      actualMinuteOfDay: 9 * 60,
    };
    const board = scoreAll(inputs, partial, W);
    expect(board.scoredCategories.sort()).toEqual(["date", "time"]);
    // 30 for the date + 15 for the time, and nothing from the unscored four.
    expect(board.participants[0].total).toBe(45);
    expect(board.participants[0].categories.weight.points).toBeNull();
    expect(board.closest.weight).toEqual([]);
  });

  it("lets a host-awarded name credit override the automatic result", () => {
    const board = scoreAll(
      [
        { participantId: "exact", guess: perfectGuess },
        {
          participantId: "closeEnough",
          guess: { ...perfectGuess, firstName: "Avah" },
          nameCredit: 10,
        },
      ],
      fullActual,
      W,
    );
    const credited = board.participants.find(
      (p) => p.participantId === "closeEnough",
    );
    expect(credited?.categories.name.points).toBe(10);
    expect(credited?.total).toBe(100);
  });

  it("keeps a non-guesser out of the closest-guess running", () => {
    const board = scoreAll(
      [
        { participantId: "guessed", guess: perfectGuess },
        {
          participantId: "skipped",
          guess: { ...perfectGuess, weightGrams: null },
        },
      ],
      fullActual,
      W,
    );
    expect(board.closest.weight).toEqual(["guessed"]);
  });
});
