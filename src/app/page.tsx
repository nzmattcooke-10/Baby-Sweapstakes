import { redirect } from "next/navigation";
import { JoinFlow } from "@/components/onboarding/JoinFlow";
import { Icon } from "@/components/zine/Icon";
import { StepNumber } from "@/components/zine/StepNumber";
import { Arrow, Underline } from "@/components/zine/Marks";
import { Tally } from "@/components/zine/Tally";
import { roughRing } from "@/components/zine/rough";
import { countCommitted, getCurrentUser, getSweepstake } from "@/lib/data";
import { daysBetween, formatLongDate, todayISO } from "@/lib/window";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect(user.participant.committedAt ? "/board" : "/guess");

  const sweepstake = await getSweepstake();
  const { committed, total } = await countCommitted(sweepstake.id);
  const daysToGo = daysBetween(todayISO(), sweepstake.dueDate);

  const countdown =
    daysToGo > 0 ? String(daysToGo) : daysToGo === 0 ? "TODAY" : String(-daysToGo);
  const countdownNote =
    daysToGo > 1
      ? "days to go"
      : daysToGo === 1
        ? "day to go"
        : daysToGo === 0
          ? "due today"
          : daysToGo === -1
            ? "day overdue"
            : "days overdue";

  // The ring somebody draws around the number that matters. Sized to the
  // numeral, and wider when the numeral is a word.
  const wide = countdown.length > 2;
  const ringW = wide ? 128 : 74;

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-5 px-5 pt-6 pb-14">
      {/* ---------------------------------------------------- the masthead -- */}
      <header>
        <h1 className="marker-caps text-[2.9rem] leading-[0.94] sm:text-[4.2rem]">
          {sweepstake.name}
        </h1>
        <Underline color="teal" width="9rem" className="mt-2" />
      </header>

      {/* ------------------------------------------------- the countdown --- */}
      <section aria-label="Countdown">
        <div className="drawn flex items-center gap-4 px-4 py-3">
          {/* The numeral, ringed by hand. The ring is drawn rather than a
              border so it can be open at one side and overshoot where it
              closes — the mark you actually make around a number. */}
          <span className="relative shrink-0" aria-hidden="true">
            <svg
              viewBox={`0 0 ${ringW} 80`}
              className="absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)]"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d={roughRing(ringW / 2, 40, ringW / 2 - 4, 35, "countdown-ring")}
                stroke="var(--hl-pink)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              className={`marker-caps relative block leading-[0.8] tabular-nums ${
                wide ? "text-[2.5rem]" : "text-[4.4rem]"
              }`}
            >
              {countdown}
            </span>
          </span>

          <div className="min-w-0">
            <p className="marker-caps text-[1.5rem] leading-[1.05]" aria-hidden="true">
              {countdownNote}
            </p>
            <p className="mt-1.5 text-base text-ink-soft">
              Due {formatLongDate(sweepstake.dueDate)}
            </p>
          </div>
        </div>

        <p className="sr-only">
          {daysToGo > 0
            ? `${daysToGo} ${countdownNote} until the due date, ${formatLongDate(sweepstake.dueDate)}.`
            : daysToGo === 0
              ? `The due date is today, ${formatLongDate(sweepstake.dueDate)}.`
              : `${-daysToGo} ${countdownNote}. The due date was ${formatLongDate(sweepstake.dueDate)}.`}
        </p>
      </section>

      {/* -------------------------------------------------- how it works ---- */}
      {/* Three numbered panels read across, comic-strip fashion.
          The mechanic has to be drawn *before* the page asks for a name — a form
          that comes first asks a stranger to commit to a game nobody has shown
          them. But the contract also promises the primary action in the first
          viewport, and a stacked three-step diagram pushed it 290px below the
          fold on a small phone. A strip costs a third of the height, and the
          precise rule follows underneath in one sentence, so nothing is lost
          except the space. */}
      <section aria-label="How it works" className="flex flex-col gap-3">
        {/* A grid rather than a flex row: three equal columns with fixed arrow
            gutters, so the panels are the same width at every viewport. Under
            flex they sized to their captions and the strip came out ragged —
            three beats of one sequence have to be the same beat. */}
        <ol
          className="grid items-stretch gap-1"
          style={{ gridTemplateColumns: "1fr auto 1fr auto 1fr" }}
        >
          {[
            { n: 1, icon: "pen" as const, label: "You guess", box: "drawn-b" },
            { n: 2, icon: "sealed" as const, label: "All sealed", box: "drawn-c" },
            { n: 3, icon: "day" as const, label: "Board opens", box: "drawn-d" },
          ].map((step, index) => (
            <li key={step.n} className="contents">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center text-ink"
                >
                  <Arrow dir="right" size={26} />
                </span>
              )}
              <span
                className={`${step.box} flex flex-col items-center gap-1 px-1 py-3 text-center`}
              >
                <StepNumber n={step.n} size={26} />
                <Icon name={step.icon} size={30} />
                {/* Captions are one word per line in every panel, so no single
                    panel breaks while its neighbours hold. */}
                <span className="marker-caps text-base leading-tight">
                  {step.label.split(" ").map((word) => (
                    <span key={word} className="block">
                      {word}
                    </span>
                  ))}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <p className="text-lg leading-snug">
          Nobody sees anyone else&rsquo;s guesses until they&rsquo;ve locked in
          their own. That&rsquo;s{" "}
          <span className="hl hl-pink">the whole game.</span>
        </p>
      </section>

      {/* ------------------------------------------------------- the join --- */}
      <section className="drawn px-4 py-5" aria-label="Join in">
        <JoinFlow />
      </section>

      {/* ------------------------------------------------------ the tally --- */}
      {total > 0 && (
        <section aria-label="Who has locked in">
          <Tally committed={committed} total={total} />
        </section>
      )}
    </main>
  );
}
