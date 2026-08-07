import "server-only";

import { eq } from "drizzle-orm";
import type { IconName } from "@/components/zine/Icon";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  guess as guessTable,
  participant as participantTable,
  result as resultTable,
  sweepstake as sweepstakeTable,
  type Guess,
  type Participant,
  type Result,
  type Sweepstake,
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
  const db = await getDb();
  const rows = await db.select().from(sweepstakeTable).limit(1);
  if (rows.length === 0) {
    throw new Error(
      "No sweepstake found. Run `npm run db:migrate && npm run db:seed`.",
    );
  }
  return rows[0];
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

  const db = await getDb();
  const [participant] = await db
    .select()
    .from(participantTable)
    .where(eq(participantTable.id, session.participantId))
    .limit(1);

  if (!participant) return null;

  const sweepstake = await getSweepstake();
  const [existing] = await db
    .select()
    .from(guessTable)
    .where(eq(guessTable.participantId, participant.id))
    .limit(1);

  // A participant always has a guess row; it just starts entirely empty.
  const guess =
    existing ??
    (
      await db
        .insert(guessTable)
        .values({ participantId: participant.id })
        .returning()
    )[0];

  return { participant, guess, sweepstake };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

export async function getResult(sweepstakeId: string): Promise<Result | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(resultTable)
    .where(eq(resultTable.sweepstakeId, sweepstakeId))
    .limit(1);
  return row ?? null;
}

export async function countCommitted(sweepstakeId: string): Promise<{
  committed: number;
  total: number;
}> {
  const db = await getDb();
  const rows = await db
    .select({ committedAt: participantTable.committedAt })
    .from(participantTable)
    .where(eq(participantTable.sweepstakeId, sweepstakeId));

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
  "name",
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
  name: { title: "The name", blurb: "Kept secret until it's announced", icon: "name" },
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
    case "name":
      return guess.firstName !== null && guess.firstName.trim() !== "";
  }
}

export function allPanelsDone(guess: Guess): boolean {
  return PANELS.every((p) => panelDone(guess, p));
}
