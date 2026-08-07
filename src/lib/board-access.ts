import "server-only";

import { listParticipantGuesses } from "@/db";
import type { Sweepstake } from "@/db/schema";

/**
 * The single place the visibility rules are enforced.
 *
 * Everything the board renders comes through here, and the rules are applied by
 * *omitting data from the payload* rather than by hiding it in the UI. A board
 * that fetched everything and hid it with CSS would be readable by any relative
 * who opened devtools, which would quietly defeat the entire game.
 *
 * Four states:
 *
 *   drafting   — nothing about anyone else, just the locked-in count
 *   committed  — everyone's date, time, weight, length and sex
 *   names out  — ...plus everyone's name guesses
 *   revealed   — ...plus the real result and the leaderboard
 *
 * Note `firstName` is an optional property. Before names are released it is
 * *absent*, not null or blank — there is no field to accidentally render, log,
 * or serialise.
 */

export type BoardEntry = {
  participantId: string;
  displayName: string;
  avatarKey: string;
  accentColor: string;
  birthDate: string | null;
  birthMinuteOfDay: number | null;
  weightGrams: number | null;
  lengthMm: number | null;
  sex: "boy" | "girl" | null;
  /** Present only once the host has released names. */
  firstName?: string;
};

export type BoardView =
  | {
      state: "locked";
      committed: number;
      total: number;
      reason: "not-committed";
    }
  | {
      state: "open";
      entries: BoardEntry[];
      namesReleased: boolean;
      committed: number;
      total: number;
      /** Participants who never got their guesses in. */
      missing: Array<{ displayName: string; avatarKey: string; accentColor: string }>;
    };

export async function getBoardView(
  sweepstake: Sweepstake,
  viewerHasCommitted: boolean,
): Promise<BoardView> {
  const rows = (await listParticipantGuesses()).map(({ participant, guess }) => ({
    participantId: participant.id,
    displayName: participant.displayName,
    avatarKey: participant.avatarKey,
    accentColor: participant.accentColor,
    committedAt: participant.committedAt,
    birthDate: guess.birthDate,
    birthMinuteOfDay: guess.birthMinuteOfDay,
    weightGrams: guess.weightGrams,
    lengthMm: guess.lengthMm,
    sex: guess.sex,
    firstName: guess.firstName,
  }));

  const committedRows = rows.filter((r) => r.committedAt !== null);
  const committed = committedRows.length;
  const total = rows.length;

  // The gate. Everything below this line is unreachable until you've committed.
  if (!viewerHasCommitted) {
    return { state: "locked", committed, total, reason: "not-committed" };
  }

  const namesReleased = sweepstake.namesReleasedAt !== null;

  const entries: BoardEntry[] = committedRows.map((row) => {
    const entry: BoardEntry = {
      participantId: row.participantId,
      displayName: row.displayName,
      avatarKey: row.avatarKey,
      accentColor: row.accentColor,
      birthDate: row.birthDate,
      birthMinuteOfDay: row.birthMinuteOfDay,
      weightGrams: row.weightGrams,
      lengthMm: row.lengthMm,
      sex: row.sex,
    };
    // Built by addition, never by deletion: forgetting a `delete` is a silent
    // leak, whereas forgetting to add a field is a visibly missing name.
    if (namesReleased && row.firstName) entry.firstName = row.firstName;
    return entry;
  });

  return {
    state: "open",
    entries,
    namesReleased,
    committed,
    total,
    missing: rows
      .filter((r) => r.committedAt === null)
      .map((r) => ({
        displayName: r.displayName,
        avatarKey: r.avatarKey,
        accentColor: r.accentColor,
      })),
  };
}
