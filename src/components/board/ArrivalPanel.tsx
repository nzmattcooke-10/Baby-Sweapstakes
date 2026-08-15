import { BabySvg } from "@/components/baby/BabySvg";
import { Confetti } from "./Confetti";
import { Icon } from "@/components/zine/Icon";
import type { Result } from "@/db/schema";
import { formatLength, formatTime, formatWeight } from "@/lib/units";
import { daysBetween, formatLongDate } from "@/lib/window";

/**
 * The announcement, and the whole point of the app.
 *
 * It sits above every guessing panel and — unlike the rest of the board — it is
 * shown to everyone, including anyone who never locked a guess in. Gating the
 * guesses is the game; gating the news that the baby arrived would just be mean.
 *
 * The drawing is the payoff of the morph system: it's rendered at the real
 * weight and length, so this is a picture of *this* baby, not a generic one.
 * Every field is optional because the host enters what they know as they know
 * it — a name and a date hours before an official weight.
 */
export function ArrivalPanel({
  result,
  dueDate,
}: {
  result: Result;
  /** So the blurb can say whether she kept to her own schedule. */
  dueDate: string;
}) {
  const name = result.actualName?.trim();
  const sex = result.actualSex;
  const heading = name ? `Welcome Baby ${name}!` : "The baby is here!";

  const bornBits = [
    result.actualDate ? `Born ${formatLongDate(result.actualDate)}` : null,
    result.actualMinuteOfDay !== null
      ? `at ${formatTime(result.actualMinuteOfDay)}`
      : null,
  ].filter(Boolean);

  // Metric leads and imperial follows in brackets underneath — the family reads
  // in kilos, but the grandparents still think in pounds and ounces.
  const facts = [
    result.actualWeightGrams !== null
      ? {
          label: "Weight",
          value: formatWeight(result.actualWeightGrams, "metric"),
          sub: formatWeight(result.actualWeightGrams, "imperial"),
        }
      : null,
    result.actualLengthMm !== null
      ? {
          label: "Length",
          value: formatLength(result.actualLengthMm, "metric"),
          sub: formatLength(result.actualLengthMm, "imperial"),
        }
      : null,
    sex
      ? {
          label: "And she is",
          value: sex === "girl" ? "A girl" : "A boy",
          sub: null,
        }
      : null,
  ].filter((f) => f !== null);

  // "And she is" only reads right for a girl; keep it neutral otherwise.
  if (facts.length > 0 && sex === "boy") {
    const last = facts[facts.length - 1];
    if (last.label === "And she is") last.label = "And he is";
  }

  const pronoun = sex === "girl" ? "She" : sex === "boy" ? "He" : "They";
  const their = sex === "girl" ? "her" : sex === "boy" ? "his" : "their";
  const headwear =
    sex === "girl" ? "bonnet" : sex === "boy" ? ("cap" as const) : ("none" as const);

  // How well she kept to her own schedule, worked out rather than written in,
  // so the line stays true if the date is ever corrected.
  const dayOff = result.actualDate ? daysBetween(dueDate, result.actualDate) : null;
  const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
  const punctuality =
    dayOff === null
      ? null
      : dayOff === 0
        ? `perfectly punctual with ${their} arrival, landing on ${their} due date to the very day`
        : dayOff < 0
          ? `${days(-dayOff)} early with ${their} arrival, far too excited to wait`
          : `${days(dayOff)} late with ${their} arrival, and worth every extra one`;

  // It opens the sentence now, so it needs the capital the fragment doesn't
  // carry.
  const opening = punctuality ?? `${pronoun} was worth every minute of the wait`;
  const blurb = opening.charAt(0).toUpperCase() + opening.slice(1);

  return (
    <>
      {/* Deliberately a sibling of the panel, not a child. `ink-in` leaves a
          `filter` on the section, and a filtered ancestor makes `position:
          fixed` resolve against *it* rather than the viewport — which pinned the
          confetti inside the banner instead of across the screen. */}
      <Confetti />

      <section
        aria-labelledby="arrival-heading"
        className="filled ink-in px-5 py-6 text-center"
      >
      <p
        aria-hidden="true"
        className="flex items-center justify-center gap-2 text-ink"
      >
        <Icon name="cheer" size={30} strokeWidth={2.4} />
        <Icon name="star" size={22} strokeWidth={2.6} />
        <Icon name="cheer" size={30} strokeWidth={2.4} />
      </p>

      <h2
        id="arrival-heading"
        className="marker-caps mt-2 text-4xl leading-tight text-balance"
      >
        {heading}
      </h2>

      {bornBits.length > 0 && (
        <p className="mt-2 text-lg">{bornBits.join(" ")}.</p>
      )}

      {result.actualWeightGrams !== null && (
        <div aria-hidden="true" className="mt-3 flex justify-center">
          {/* Two drawn poses stacked and cut between, so she waves her arms up
              and down like a flipbook rather than a tweened vector. */}
          <span className="relative inline-block leading-[0]">
            <BabySvg
              weightGrams={result.actualWeightGrams}
              lengthMm={result.actualLengthMm ?? 500}
              headwear={headwear}
              armPose="down"
              width={168}
              className="baby-frame-a"
            />
            <BabySvg
              weightGrams={result.actualWeightGrams}
              lengthMm={result.actualLengthMm ?? 500}
              headwear={headwear}
              armPose="tucked"
              width={168}
              className="baby-frame-b absolute inset-0"
            />
          </span>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="mt-3 flex flex-wrap justify-center gap-x-7 gap-y-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm text-ink-soft">{fact.label}</dt>
              <dd className="marker-caps text-2xl leading-tight">{fact.value}</dd>
              {fact.sub && (
                <dd className="text-sm text-ink-soft">({fact.sub})</dd>
              )}
            </div>
          ))}
        </dl>
      )}

        <p className="mt-4 text-lg text-balance italic">
          {blurb}. Welcome to the world, {name ?? "little one"}!
        </p>
      </section>
    </>
  );
}
