import Link from "next/link";
import { Avatar } from "@/components/avatars/Avatar";
import { Icon } from "@/components/zine/Icon";
import { Board } from "@/components/board/Board";
import { SignOutButton } from "@/components/SignOutButton";
import { LockedBoard } from "@/components/board/LockedBoard";
import { getBoardView } from "@/lib/board-access";
import { getWindow, requireUser } from "@/lib/data";
import { daysBetween, formatLongDate, todayISO } from "@/lib/window";

export default async function BoardPage(props: {
  searchParams: Promise<{ justCommitted?: string | string[] }>;
}) {
  const { justCommitted } = await props.searchParams;
  const { participant, sweepstake } = await requireUser();

  const view = await getBoardView(
    sweepstake,
    participant.committedAt !== null,
  );
  const win = await getWindow(sweepstake);
  const daysToGo = daysBetween(todayISO(), sweepstake.dueDate);

  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-14">
      <header className="flex items-center gap-3">
        <Avatar
          avatarKey={participant.avatarKey}
          accent={participant.accentColor}
          size={44}
        />
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
          <Board
            entries={view.entries}
            window={win}
            namesReleased={view.namesReleased}
          />

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

      <footer className="flex justify-center gap-5 pt-3 text-base">
        <Link href="/results" className="min-h-[44px] underline decoration-2 underline-offset-4">
          Scores
        </Link>
        <Link href="/admin" className="min-h-[44px] underline decoration-2 underline-offset-4">
          Host tools
        </Link>
        <SignOutButton />
      </footer>
    </main>
  );
}
