"use server";

import { redirect } from "next/navigation";
import { commitParticipant, updateDraftGuess } from "@/db";
import type { Guess, GuessPatch, Participant, Sweepstake } from "@/db/schema";
import { allPanelsDone, requireUser } from "@/lib/data";
import { todayISO } from "@/lib/window";

/**
 * Every write goes through `editableGuess()` first.
 *
 * Both of the rules it enforces are load-bearing and neither can live in the
 * UI. "Locked once committed" is the whole basis of the game being fair — if it
 * were only a hidden button, anyone could re-post the form after seeing
 * everyone else's guesses. And "entries close" has to hold against a request
 * that was already in flight when the host tapped the button from a hospital.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

type EditableContext =
  | { ok: false; error: string }
  | { ok: true; participant: Participant; guess: Guess; sweepstake: Sweepstake };

async function editableGuess(): Promise<EditableContext> {
  const { participant, guess, sweepstake } = await requireUser();

  if (sweepstake.status !== "open") {
    return {
      ok: false,
      error:
        "Entries have closed — the baby's on the way! Your guesses are locked in as they are.",
    };
  }
  if (participant.committedAt !== null) {
    return {
      ok: false,
      error:
        "You've already locked in your guesses, so they can't be changed now.",
    };
  }
  return { ok: true, participant, guess, sweepstake };
}

async function patchGuess(patch: GuessPatch): Promise<ActionResult> {
  const context = await editableGuess();
  if (!context.ok) return { ok: false, error: context.error };

  const result = await updateDraftGuess(context.participant.id, patch);
  if (result === "closed") {
    return {
      ok: false,
      error:
        "Entries have closed — the baby's on the way! Your guesses are locked in as they are.",
    };
  }
  if (result === "committed") {
    return {
      ok: false,
      error: "You've already locked in your guesses, so they can't be changed now.",
    };
  }

  return { ok: true };
}

/* ------------------------------------------------------------- panels -- */

export async function saveDate(iso: string): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { ok: false, error: "That isn't a date we recognise." };
  }
  const { sweepstake } = await requireUser();
  if (iso < todayISO() || iso > sweepstake.calendarEnd) {
    return { ok: false, error: "That day isn't in the guessing window." };
  }
  return patchGuess({ birthDate: iso });
}

export async function saveTime(minuteOfDay: number): Promise<ActionResult> {
  if (!Number.isInteger(minuteOfDay) || minuteOfDay < 0 || minuteOfDay > 1439) {
    return { ok: false, error: "That isn't a time of day." };
  }
  return patchGuess({ birthMinuteOfDay: minuteOfDay });
}

export async function saveWeight(grams: number): Promise<ActionResult> {
  if (!Number.isFinite(grams) || grams < 500 || grams > 8000) {
    return { ok: false, error: "That weight is outside what we can record." };
  }
  return patchGuess({ weightGrams: Math.round(grams) });
}

export async function saveLength(mm: number): Promise<ActionResult> {
  if (!Number.isFinite(mm) || mm < 250 || mm > 750) {
    return { ok: false, error: "That length is outside what we can record." };
  }
  return patchGuess({ lengthMm: Math.round(mm) });
}

export async function saveSex(sex: "boy" | "girl"): Promise<ActionResult> {
  if (sex !== "boy" && sex !== "girl") {
    return { ok: false, error: "Pick one of the two." };
  }
  return patchGuess({ sex });
}

/* ------------------------------------------------------------- commit -- */

/**
 * The point of no return. Sets committedAt on both the guess and the
 * participant — the latter is what unlocks the board for them.
 */
export async function commitGuesses(): Promise<ActionResult> {
  const context = await editableGuess();
  if (!context.ok) return { ok: false, error: context.error };

  if (!allPanelsDone(context.guess)) {
    return { ok: false, error: "There are still guesses to make." };
  }

  if (!(await commitParticipant(context.participant.id))) {
    return { ok: false, error: "Those guesses were already locked in." };
  }

  redirect("/board?justCommitted=1");
}
