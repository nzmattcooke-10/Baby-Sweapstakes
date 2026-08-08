import "server-only";

import type { IconName } from "@/components/zine/Icon";
import { redirect } from "next/navigation";
import {
  listParticipants,
  readGuess,
  readParticipant,
  readResult,
  readSweepstake,
} from "@/db";
import type {
  Guess,
  Participant,
  Result,
  Sweepstake,
} from "@/db/schema";
import { getSession } from "./session";
import { calendarWindow, type CalendarWindow } from "./window";

/**
 * Server-only data access. The `server-only` import means importing any of this
 * from a client component is a build error rather than a runtime leak — which
 * matters here, because these functions read guesses that the visibility rules
 * say most people aren't allowed to see.
 */

export async function getSweepstake(): Promise<Sweepstake> {
  return readSweepstake();
}

export async function getWindow(s: Sweepstake): Promise<CalendarWindow> {
  return calendarWindow(s.calendarStart, s.calendarEnd, s.dueDate);
}

export type CurrentUser = {
  participant: Participant;
  guess: Guess;
  sweepstake: Sweepstake;
};

/** The signed-in participant, or null. Never throws for a signed-out visitor. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  // These three reads don't depend on one another, so fire them concurrently:
  // on D1 that collapses three sequential round-trips into roughly one, and this
  // runs on every signed-in page load. A stale session (participant gone) wastes
  // the other two reads, but that path is rare and the reads are harmless.
  const [participant, sweepstake, guess] = await Promise.all([
    readParticipant(session.participantId),
    getSweepstake(),
    readGuess(session.participantId),
  ]);
  if (!participant) return null;

  return { participant, guess, sweepstake };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function getResult(sweepstakeId: string): Promise<Result | null> {
  if (sweepstakeId !== (await getSweepstake()).id) return null;
  return readResult();
}

export async function countCommitted(sweepstakeId: string): Promise<{
  committed: number;
  total: number;
}> {
  const rows =
    sweepstakeId === (await getSweepstake()).id ? await listParticipants() : [];

  return {
    committed: rows.filter((r) => r.committedAt !== null).length,
    total: rows.length,
  };
}

/* ------------------------------------------------------------ progress -- */

export const PANELS = [
  "date",
  "time",
  "weight",
  "length",
  "sex",
] as const;

export type PanelKey = (typeof PANELS)[number];

/**
 * `icon` names a drawn icon from `@/components/zine/Icon`. These were emoji
 * until the redesign, which meant the app's icon set was really a dozen
 * different illustrators rendering at a dozen different weights on whatever
 * device each relative happened to own.
 */
export const PANEL_META: Record<
  PanelKey,
  { title: string; blurb: string; icon: IconName }
> = {
  date: { title: "The day", blurb: "Pick a square on the calendar", icon: "day" },
  time: { title: "The time", blurb: "Move the sun across the sky", icon: "time" },
  weight: { title: "The weight", blurb: "Load up the scale", icon: "weight" },
  length: { title: "The length", blurb: "Stretch out the ruler", icon: "length" },
  sex: { title: "Boy or girl", blurb: "Bonnet or cap?", icon: "sex" },
};

export function panelDone(guess: Guess, panel: PanelKey): boolean {
  switch (panel) {
    case "date":
      return guess.birthDate !== null;
    case "time":
      return guess.birthMinuteOfDay !== null;
    case "weight":
      return guess.weightGrams !== null;
    case "length":
      return guess.lengthMm !== null;
    case "sex":
      return guess.sex !== null;
  }
}

export function allPanelsDone(guess: Guess): boolean {
  return PANELS.every((p) => panelDone(guess, p));
}
