import "server-only";

import { listParticipantGuesses } from "@/db";

/**
 * The single place the visibility rules are enforced.
 *
 * Everything the board renders comes through here, and the rules are applied by
 * *omitting data from the payload* rather than by hiding it in the UI. A board
 * that fetched everything and hid it with CSS would be readable by any relative
 * who opened devtools, which would quietly defeat the entire game.
 *
 * Three states:
 *
 *   drafting   — nothing about anyone else, just the locked-in count
 *   committed  — everyone's date, time, weight, length and sex
 *   revealed   — ...plus the real result and the leaderboard
 */

export type BoardEntry = {
  participantId: string;
  displayName: string;
  avatarKey: string;
  avatarPhoto: string | null;
  accentColor: string;
  birthDate: string | null;
  birthMinuteOfDay: number | null;
  weightGrams: number | null;
  lengthMm: number | null;
  sex: "boy" | "girl" | null;
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
      committed: number;
      total: number;
      /** Participants who never got their guesses in. */
      missing: Array<{
        displayName: string;
        avatarKey: string;
        avatarPhoto: string | null;
        accentColor: string;
      }>;
    };

export async function getBoardView(
  viewerHasCommitted: boolean,
): Promise<BoardView> {
  const rows = (await listParticipantGuesses()).map(({ participant, guess }) => ({
    participantId: participant.id,
    displayName: participant.displayName,
    avatarKey: participant.avatarKey,
    avatarPhoto: participant.avatarPhoto,
    accentColor: participant.accentColor,
    committedAt: participant.committedAt,
    birthDate: guess.birthDate,
    birthMinuteOfDay: guess.birthMinuteOfDay,
    weightGrams: guess.weightGrams,
    lengthMm: guess.lengthMm,
    sex: guess.sex,
  }));

  const committedRows = rows.filter((r) => r.committedAt !== null);
  const committed = committedRows.length;
  const total = rows.length;

  // The gate. Everything below this line is unreachable until you've committed.
  if (!viewerHasCommitted) {
    return { state: "locked", committed, total, reason: "not-committed" };
  }

  const entries: BoardEntry[] = committedRows.map((row) => ({
    participantId: row.participantId,
    displayName: row.displayName,
    avatarKey: row.avatarKey,
    avatarPhoto: row.avatarPhoto,
    accentColor: row.accentColor,
    birthDate: row.birthDate,
    birthMinuteOfDay: row.birthMinuteOfDay,
    weightGrams: row.weightGrams,
    lengthMm: row.lengthMm,
    sex: row.sex,
  }));

  return {
    state: "open",
    entries,
    committed,
    total,
    missing: rows
      .filter((r) => r.committedAt === null)
      .map((r) => ({
        displayName: r.displayName,
        avatarKey: r.avatarKey,
        avatarPhoto: r.avatarPhoto,
        accentColor: r.accentColor,
      })),
  };
}
