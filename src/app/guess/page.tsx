import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatars/Avatar";
import { Icon } from "@/components/zine/Icon";
import { StepNumber } from "@/components/zine/StepNumber";
import {
  PANELS,
  PANEL_META,
  allPanelsDone,
  countCommitted,
  panelDone,
  requireUser,
} from "@/lib/data";
import { formatLength, formatTime, formatWeight } from "@/lib/units";
import { formatShortDate } from "@/lib/window";
import { SignOutButton } from "@/components/SignOutButton";

/**
 * The hub. Five panels, each ticked as it's filled, and the commit button only
 * once every one of them is done.
 */
export default async function GuessHubPage() {
  const { participant, guess, sweepstake } = await requireUser();

  // Committing is final, so there is nothing to come back to.
  if (participant.committedAt) redirect("/board");

  const { committed, total } = await countCommitted(sweepstake.id);
  const ready = allPanelsDone(guess);
  const doneCount = PANELS.filter((p) => panelDone(guess, p)).length;

  // Four drawn rectangles, cycled so no two boxes in the stack are the same
  // drawing traced twice.
  const BOXES = ["drawn", "drawn-b", "drawn-c", "drawn-d"] as const;

  // Whichever panel is next gets the emphasis, so the page points at the work
  // instead of presenting six equal options.
  const firstUndone = PANELS.findIndex((p) => !panelDone(guess, p));

  function summary(panel: (typeof PANELS)[number]): string | null {
    switch (panel) {
      case "date":
        return guess.birthDate ? formatShortDate(guess.birthDate) : null;
      case "time":
        return guess.birthMinuteOfDay !== null
          ? formatTime(guess.birthMinuteOfDay)
          : null;
      case "weight":
        return guess.weightGrams !== null ? formatWeight(guess.weightGrams) : null;
      case "length":
        return guess.lengthMm !== null ? formatLength(guess.lengthMm) : null;
      case "sex":
        return guess.sex === "girl" ? "A girl" : guess.sex === "boy" ? "A boy" : null;
    }
  }

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-7 px-5 pt-8 pb-14">
      <header className="flex items-center gap-4">
        <Avatar
          avatarKey={participant.avatarKey}
          accent={participant.accentColor}
          size={60}
        />
        <div className="min-w-0">
          <h1 className="marker-caps text-3xl leading-tight">
            {participant.displayName}
          </h1>
          <p className="mt-1 text-base text-ink-soft">
            {doneCount} of {PANELS.length} guesses made
          </p>
        </div>
      </header>

      {sweepstake.status !== "open" && (
        <p className="drawn-b px-4 py-3 text-center text-lg">
          Entries have closed — the baby&rsquo;s on the way!
        </p>
      )}

      <p
        className="drawn-c px-5 py-4 text-center text-lg"
        style={{
          background: "color-mix(in srgb, var(--hl-teal) 18%, var(--surface))",
          borderWidth: "7px",
          borderImageWidth: "7px",
        }}
      >
        <span className="hl hl-yellow">$10 buy-in.</span> That&rsquo;s five
        guesses — and five shots at glory. Each category pays out to its own
        winner, so you could take home one, none, or the lot.
      </p>

      {/* Numbered panels, not a settings list. Six identical icon-title-chevron
          rows is the register this redesign exists to leave behind, so each
          panel is numbered in the hand, and whichever one is next gets drawn
          bigger — the page shows you where you are instead of listing options. */}
      <ol className="flex flex-col gap-2.5">
        {PANELS.map((panel, index) => {
          const meta = PANEL_META[panel];
          const done = panelDone(guess, panel);
          const value = summary(panel);
          const isNext = !done && index === firstUndone;

          return (
            <li key={panel}>
              <Link
                href={`/guess/${panel}`}
                className={`${BOXES[index % 4]} flex items-center gap-4 px-4 ${
                  isNext ? "min-h-[104px] py-4" : "min-h-[78px] py-3"
                }`}
              >
                <StepNumber
                  n={index + 1}
                  emphasised={isNext}
                  size={isNext ? 44 : 34}
                />

                <Icon
                  name={meta.icon}
                  size={isNext ? 40 : 30}
                  className="shrink-0"
                />

                <span className="min-w-0 flex-1">
                  <span
                    className={`marker-caps block leading-tight ${
                      isNext ? "text-2xl" : "text-xl"
                    }`}
                  >
                    {meta.title}
                  </span>
                  <span
                    className={`mt-0.5 block ${
                      done && value
                        ? "marker-caps text-lg"
                        : "text-base text-ink-soft"
                    }`}
                  >
                    {done && value ? value : meta.blurb}
                  </span>
                </span>

                {/* Only "done" gets a mark. The row is a link in its own right,
                    so an arrow on every unfinished panel was 48px of chrome
                    saying nothing — and it squeezed the marker-face titles onto
                    two lines, which is what the eye actually noticed. */}
                {done && (
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-[2.5px] border-ink"
                    style={{
                      borderRadius: "var(--radius-tick)",
                      background: "var(--hl-yellow)",
                      color: "#111",
                    }}
                  >
                    <Icon name="tick" size={22} strokeWidth={2.8} />
                  </span>
                )}

                <span className="sr-only">
                  {done
                    ? `Done: ${value}. Change it.`
                    : isNext
                      ? "Not yet guessed. This one is next."
                      : "Not yet guessed."}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {ready ? (
        <Link
          href="/guess/review"
          className="filled marker-caps flex min-h-[60px] items-center justify-center gap-3 px-6 text-xl"
        >
          Review and lock in
          <Icon name="arrow" size={28} strokeWidth={2.4} />
        </Link>
      ) : (
        <p className="text-center text-lg">
          Fill in all five and you can{" "}
          <span className="hl hl-teal">lock them in</span> — then the board opens
          up.
        </p>
      )}

      <p className="text-center text-base text-ink-soft">
        {committed} of {total} have locked in so far.
      </p>

      <footer className="flex justify-center pt-2 text-base">
        <SignOutButton />
      </footer>
    </main>
  );
}
