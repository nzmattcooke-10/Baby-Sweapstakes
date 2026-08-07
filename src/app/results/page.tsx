import Link from "next/link";
import { listParticipantGuesses } from "@/db";
import { Avatar } from "@/components/avatars/Avatar";
import { BabySvg } from "@/components/baby/BabySvg";
import { Icon } from "@/components/zine/Icon";
import { Underline } from "@/components/zine/Marks";
import { getResult, requireUser } from "@/lib/data";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  scoreAll,
  type ParticipantInput,
} from "@/lib/scoring";
import { formatLengthBoth, formatTime, formatWeightBoth } from "@/lib/units";
import { formatLongDate } from "@/lib/window";

export default async function ResultsPage() {
  const { participant, sweepstake } = await requireUser();
  const result = await getResult(sweepstake.id);

  // Same gate as the board: no peeking at other people's guesses, in any form.
  if (!participant.committedAt) {
    return (
      <Shell>
        <div className="drawn flex flex-col items-center px-5 py-7 text-center">
          <Icon name="sealed" size={48} />
          <p className="mt-3 max-w-sm text-lg">
            Lock in your own guesses first — then the scores are yours to see.
          </p>
          <Link
            href="/guess"
            className="filled marker-caps mt-5 flex min-h-[56px] items-center gap-3 px-6 text-xl"
          >
            Finish my guesses
            <Icon name="arrow" size={26} strokeWidth={2.4} />
          </Link>
        </div>
      </Shell>
    );
  }

  const nothingKnown =
    !result ||
    (result.actualDate === null &&
      result.actualMinuteOfDay === null &&
      result.actualWeightGrams === null &&
      result.actualLengthMm === null &&
      result.actualSex === null &&
      result.actualName === null);

  if (nothingKnown) {
    return (
      <Shell>
        <div className="drawn flex flex-col items-center px-6 py-9 text-center">
          <Icon name="day" size={52} />
          <h2 className="marker-caps mt-4 text-4xl">No baby yet</h2>
          <p className="mt-3 max-w-sm text-lg text-ink-soft">
            The moment the host enters the real details, the scores appear here.
          </p>
        </div>
      </Shell>
    );
  }

  const rows = (await listParticipantGuesses()).map(
    ({ participant: person, guess, credit }) => ({
      id: person.id,
      displayName: person.displayName,
      avatarKey: person.avatarKey,
      accentColor: person.accentColor,
      committedAt: person.committedAt,
      birthDate: guess.birthDate,
      birthMinuteOfDay: guess.birthMinuteOfDay,
      weightGrams: guess.weightGrams,
      lengthMm: guess.lengthMm,
      sex: guess.sex,
      firstName: guess.firstName,
      credit: credit?.awardedPoints ?? null,
    }),
  );

  // Anyone who never committed keeps their draft but scores nothing.
  const players = rows.filter((row) => row.committedAt !== null);

  const inputs: ParticipantInput[] = players.map((row) => ({
    participantId: row.id,
    guess: {
      birthDate: row.birthDate,
      birthMinuteOfDay: row.birthMinuteOfDay,
      weightGrams: row.weightGrams,
      lengthMm: row.lengthMm,
      sex: row.sex,
      firstName: row.firstName,
    },
    nameCredit: row.credit,
  }));

  const board = scoreAll(inputs, result, sweepstake.scoringWeights);
  const byId = new Map(players.map((row) => [row.id, row]));

  const actualRows: Array<[string, string]> = [];
  if (result.actualDate) actualRows.push(["Born", formatLongDate(result.actualDate)]);
  if (result.actualMinuteOfDay !== null)
    actualRows.push(["At", formatTime(result.actualMinuteOfDay)]);
  if (result.actualWeightGrams !== null)
    actualRows.push(["Weighing", formatWeightBoth(result.actualWeightGrams)]);
  if (result.actualLengthMm !== null)
    actualRows.push(["Measuring", formatLengthBoth(result.actualLengthMm)]);
  if (result.actualSex)
    actualRows.push(["It's", result.actualSex === "girl" ? "a girl" : "a boy"]);
  if (result.actualName) actualRows.push(["Named", result.actualName]);

  const pending = CATEGORY_ORDER.filter(
    (category) => !board.scoredCategories.includes(category),
  );

  return (
    <Shell>
      <section className="plate ink-in px-5 py-6 text-center">
        <h2 className="marker-caps text-4xl leading-tight">The actual baby</h2>
        <Underline color="pink" width="9rem" className="mx-auto mt-2" />
        {result.actualWeightGrams !== null && (
          <BabySvg
            weightGrams={result.actualWeightGrams}
            lengthMm={result.actualLengthMm ?? 500}
            headwear={
              result.actualSex === "girl"
                ? "bonnet"
                : result.actualSex === "boy"
                  ? "cap"
                  : "none"
            }
            width={150}
            className="mx-auto"
          />
        )}
        <dl className="mt-3 flex flex-col gap-1.5">
          {actualRows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-center gap-2.5">
              <dt style={{ color: "#5a5044" }}>{label}</dt>
              <dd className="marker-caps text-2xl">{value}</dd>
            </div>
          ))}
        </dl>
        {pending.length > 0 && (
          <p className="mt-4 text-sm" style={{ color: "#5a5044" }}>
            Still to come: {pending.map((c) => CATEGORY_LABEL[c]).join(", ")}.
          </p>
        )}
      </section>

      <section className="drawn-b px-4 py-4">
        <h2 className="marker-caps mb-3 text-2xl">Closest in each category</h2>
        <ul className="flex flex-col gap-2">
          {board.scoredCategories.map((category) => {
            const winners = board.closest[category]
              .map((id) => byId.get(id))
              .filter((row) => row !== undefined);
            return (
              <li key={category} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-base text-ink-soft">
                  {CATEGORY_LABEL[category]}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {winners.map((row) => (
                    <span key={row.id} className="flex items-center gap-1.5">
                      <Avatar
                        avatarKey={row.avatarKey}
                        accent={row.accentColor}
                        size={26}
                      />
                      <span className="marker-caps text-lg">
                        {row.displayName}
                      </span>
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="drawn-c px-4 py-4">
        <h2 className="marker-caps mb-3 text-2xl">Leaderboard</h2>
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Leaderboard, scrolls sideways"
        >
          <table className="w-full text-left">
            <caption className="sr-only">
              Overall scores, highest first
            </caption>
            <thead>
              <tr className="marker-caps text-base">
                <th scope="col" className="pb-2 pr-2">Rank</th>
                <th scope="col" className="pb-2 pr-2">Who</th>
                {CATEGORY_ORDER.map((category) => (
                  <th key={category} scope="col" className="pb-2 pr-2 text-right">
                    {CATEGORY_LABEL[category]}
                  </th>
                ))}
                <th scope="col" className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {board.participants.map((scored) => {
                const row = byId.get(scored.participantId);
                if (!row) return null;
                const isMe = row.id === participant.id;
                return (
                  <tr
                    key={scored.participantId}
                    className={`border-t-2 border-dotted border-line ${
                      isMe ? "font-semibold" : ""
                    }`}
                  >
                    <td className="py-2 pr-2">
                      {scored.rank === 1 ? (
                        <span
                          className="flex h-8 w-8 items-center justify-center border-[2.5px] border-ink"
                          style={{
                            borderRadius: "var(--radius-tick)",
                            background: "var(--hl-yellow)",
                            color: "#111",
                          }}
                        >
                          <Icon name="star" size={18} strokeWidth={2.6} />
                          <span className="sr-only">First place</span>
                        </span>
                      ) : (
                        <span className="marker-caps text-lg">{scored.rank}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <span className="flex items-center gap-2">
                        <Avatar
                          avatarKey={row.avatarKey}
                          accent={row.accentColor}
                          size={24}
                        />
                        {row.displayName}
                        {isMe && <span className="sr-only"> (you)</span>}
                      </span>
                    </td>
                    {CATEGORY_ORDER.map((category) => (
                      <td key={category} className="py-2 pr-2 text-right tabular-nums">
                        {scored.categories[category].points ?? "—"}
                      </td>
                    ))}
                    <td className="marker-caps py-2 text-right text-xl tabular-nums">
                      {scored.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pending.length > 0 && (
          <p className="mt-3 text-base text-ink-soft">
            Dashes are categories the host hasn&rsquo;t entered yet — those
            points are still to play for.
          </p>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-14">
      <header className="flex items-center justify-between gap-3">
        <h1 className="marker-caps text-3xl">Scores</h1>
        <Link
          href="/board"
          className="min-h-[44px] text-base underline decoration-2 underline-offset-4"
        >
          The board
        </Link>
      </header>
      {children}
    </main>
  );
}
