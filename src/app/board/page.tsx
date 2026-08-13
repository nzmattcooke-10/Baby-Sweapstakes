import Link from "next/link";
import { Avatar } from "@/components/avatars/Avatar";
import { Icon } from "@/components/zine/Icon";
import { Board } from "@/components/board/Board";
import { SignOutButton } from "@/components/SignOutButton";
import { LockedBoard } from "@/components/board/LockedBoard";
import { getBoardView } from "@/lib/board-access";
import { requireUser } from "@/lib/data";
import {
  calendarWindow,
  daysBetween,
  formatLongDate,
  minISO,
  todayISO,
} from "@/lib/window";

export default async function BoardPage(props: {
  searchParams: Promise<{ justCommitted?: string | string[] }>;
}) {
  const { justCommitted } = await props.searchParams;
  const { participant, sweepstake } = await requireUser();

  const view = await getBoardView(participant.committedAt !== null);

  // Keep the board grid back to the earliest committed guess (but no further),
  // so a guess whose day has already passed stays on the calendar — crossed out
  // — instead of dropping off as the window rolls forward. Today onward always
  // shows. `rollForward: false` is what lets the start sit before today.
  const today = todayISO();
  const guessedDates =
    view.state === "open"
      ? view.entries
          .map((e) => e.birthDate)
          .filter((d): d is string => d !== null)
      : [];
  const boardStart = guessedDates.reduce((earliest, d) => minISO(earliest, d), today);
  const win = calendarWindow(
    boardStart,
    sweepstake.calendarEnd,
    sweepstake.dueDate,
    today,
    { rollForward: false },
  );
  const daysToGo = daysBetween(today, sweepstake.dueDate);

  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-14">
      <header className="flex items-center gap-3">
        {/* The avatar is the way in to editing your name and face. */}
        <Link
          href="/profile"
          aria-label="Edit your name and avatar"
          className="rounded-full outline-offset-2 focus-visible:outline-3 focus-visible:outline-[var(--focus)]"
          style={{ lineHeight: 0 }}
        >
          <Avatar
            avatarKey={participant.avatarKey}
            accent={participant.accentColor}
            photo={participant.avatarPhoto}
            size={44}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="marker-caps text-3xl leading-tight">The board</h1>
          <p className="mt-1 text-base text-ink-soft">
            Due {formatLongDate(sweepstake.dueDate)}
            {daysToGo > 0 ? ` · ${daysToGo} days to go` : ""}
          </p>
        </div>
      </header>

      {justCommitted && (
        <p
          role="status"
          className="filled ink-in flex items-center justify-center gap-3 px-4 py-4 text-center"
        >
          <Icon name="cheer" size={30} className="shrink-0" strokeWidth={2.4} />
          <span className="marker-caps text-2xl leading-tight">
            Locked in! Here&rsquo;s what everyone else reckons.
          </span>
        </p>
      )}

      {sweepstake.status !== "open" && (
        <p className="drawn-b px-4 py-3 text-center text-lg">
          Entries are closed — the baby&rsquo;s on the way.
        </p>
      )}

      {view.state === "locked" ? (
        <LockedBoard committed={view.committed} total={view.total} />
      ) : (
        <>
          <Board entries={view.entries} window={win} />

          {view.missing.length > 0 && (
            <section className="drawn-c px-4 py-4">
              <h2 className="marker-caps text-xl">
                Still to lock in ({view.missing.length})
              </h2>
              <ul className="mt-3 flex flex-wrap gap-3">
                {view.missing.map((person) => (
                  <li
                    key={person.displayName}
                    className="flex items-center gap-2 text-base text-ink-soft"
                  >
                    <span className="opacity-50">
                      <Avatar
                        avatarKey={person.avatarKey}
                        accent={person.accentColor}
                        photo={person.avatarPhoto}
                        size={24}
                      />
                    </span>
                    {person.displayName}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* No host-tools link: the host reaches /admin directly and signs in with
          the host PIN. Keeping it off the board means players never see it. */}
      <footer className="flex justify-center gap-5 pt-3 text-base">
        <Link href="/results" className="min-h-[44px] underline decoration-2 underline-offset-4">
          Scores
        </Link>
        <SignOutButton />
      </footer>
    </main>
  );
}
