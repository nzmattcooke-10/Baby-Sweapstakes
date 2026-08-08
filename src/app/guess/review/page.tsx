import Link from "next/link";
import { redirect } from "next/navigation";
import { BabySvg } from "@/components/baby/BabySvg";
import { CommitButton } from "@/components/CommitButton";
import { Icon } from "@/components/zine/Icon";
import { PANEL_META, allPanelsDone, requireUser } from "@/lib/data";
import { formatLengthBoth, formatTime, formatWeightBoth } from "@/lib/units";
import { formatLongDate } from "@/lib/window";

export default async function ReviewPage() {
  const { participant, guess } = await requireUser();
  if (participant.committedAt) redirect("/board");
  if (!allPanelsDone(guess)) redirect("/guess");

  const rows: Array<{ panel: keyof typeof PANEL_META; value: string }> = [
    { panel: "date", value: formatLongDate(guess.birthDate!) },
    { panel: "time", value: formatTime(guess.birthMinuteOfDay!) },
    { panel: "weight", value: formatWeightBoth(guess.weightGrams!) },
    { panel: "length", value: formatLengthBoth(guess.lengthMm!) },
    { panel: "sex", value: guess.sex === "girl" ? "A girl" : "A boy" },
  ];

  const BOXES = ["drawn", "drawn-b", "drawn-c", "drawn-d"] as const;

  return (
    <main id="main" className="mx-auto flex max-w-lg flex-col gap-7 px-5 pt-6 pb-14">
      <div className="flex items-center gap-4">
        <Link
          href="/guess"
          className="drawn-b flex min-h-[48px] min-w-[48px] items-center justify-center px-1"
        >
          <Icon name="arrow" size={24} className="rotate-180" />
          <span className="sr-only">Back to all guesses</span>
        </Link>
        <h1 className="marker-caps text-3xl leading-tight">
          Your final answer?
        </h1>
      </div>

      {/* The baby you've described, on its own printed plate. */}
      <div className="plate flex justify-center px-4 py-5">
        <BabySvg
          weightGrams={guess.weightGrams!}
          lengthMm={guess.lengthMm!}
          headwear={guess.sex === "girl" ? "bonnet" : "cap"}
          width={170}
        />
      </div>

      <dl className="flex flex-col gap-2.5">
        {rows.map(({ panel, value }, index) => (
          <div
            key={panel}
            className={`${BOXES[index % 4]} flex items-center gap-3 px-4 py-3`}
          >
            <Icon
              name={PANEL_META[panel].icon}
              size={28}
              className="shrink-0"
            />
            <dt className="sr-only">{PANEL_META[panel].title}</dt>
            <dd className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm text-ink-soft">
                  {PANEL_META[panel].title}
                </span>
                <span className="marker-caps block text-xl leading-tight">
                  {value}
                </span>
              </span>
              <Link
                href={`/guess/${panel}`}
                className="min-h-[44px] shrink-0 self-center text-base underline decoration-2 underline-offset-4"
              >
                Change
                <span className="sr-only"> {PANEL_META[panel].title}</span>
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      <CommitButton />
    </main>
  );
}
