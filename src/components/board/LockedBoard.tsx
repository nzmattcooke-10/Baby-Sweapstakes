import Link from "next/link";
import { Icon } from "@/components/zine/Icon";
import { Arrow } from "@/components/zine/Marks";
import { Tally } from "@/components/zine/Tally";
import { scribbleShadow } from "@/components/zine/rough";

/**
 * What you see before you've committed.
 *
 * Every shape here is invented. It is tempting to render the real board under a
 * blur — it looks better and it teases harder — but a blur is a CSS property,
 * and the data underneath it would sit in the page source for anyone who cared
 * to look. The server never sends it, and this never asks for it.
 *
 * The redesign made that honesty visible rather than incidental: the placeholder
 * panels are drawn as blank boxes with scribbled-out rows, which is what an
 * unfilled sheet actually looks like. Nothing here pretends to be redacted real
 * data, because none of it ever was.
 */
export function LockedBoard({
  committed,
  total,
}: {
  committed: number;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="drawn flex flex-col items-center px-5 py-7 text-center">
        <Icon name="sealed" size={58} />
        <h2 className="marker-caps mt-3 text-4xl leading-tight">
          The board is sealed
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-lg leading-snug">
          Lock in your own six guesses and it opens up — everyone&rsquo;s days,
          weights, times and hunches, all at once.
        </p>

        <div className="mt-6 w-full" aria-live="polite">
          <Tally committed={committed} total={total} />
        </div>

        <Arrow dir="down" size={38} className="mt-5" />

        <Link
          href="/guess"
          className="filled marker-caps mt-1 flex min-h-[58px] items-center justify-center gap-3 px-6 text-xl"
        >
          Finish my guesses
          <Icon name="arrow" size={26} strokeWidth={2.4} />
        </Link>
      </div>

      {/* The panels that are waiting, with every answer scribbled out.

          Every shape is invented — see the note above. Nothing here is real
          data under a mask; the server never sent any. */}
      <div aria-hidden="true" className="flex flex-col gap-3">
        {(["drawn-b", "drawn-c", "drawn-d"] as const).map((box, panel) => {
          const label = ["The day", "The weight", "The time"][panel];
          const count = 6 + panel * 2;
          return (
            <div key={box} className={`${box} px-4 py-4`}>
              {/* Named, then scribbled over.
                  Two earlier attempts read as a shimmer skeleton rather than as
                  a withheld page: empty tiles say "not loaded yet" whatever
                  shape they are, and a row of them in a soft value says it
                  twice. Redaction is the opposite reading — something is
                  written here and you are not allowed it — so each answer is a
                  bar scribbled out in ink, and the title is struck through at
                  full ink weight rather than veiled behind an opacity. */}
              <div className="mb-3 flex items-center gap-3">
                <Icon name="sealed" size={26} className="shrink-0" />
                <span className="relative marker-caps text-2xl leading-tight">
                  {label}
                  <svg
                    className="absolute inset-x-[-4%] top-1/2 h-3 w-[108%] -translate-y-1/2"
                    viewBox="0 0 120 12"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M2 7 C30 3 62 9 92 5 C104 3 114 7 118 5"
                      stroke="var(--ink)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </div>

              {/* One redacted bar per person, each scribbled out separately. */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: count }, (_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 40 26"
                    className="h-7 w-10"
                    fill="none"
                  >
                    {scribbleShadow(20, 13, 17, 8, `redact-${panel}-${i}`, {
                      strokes: 6,
                    }).map((d, j) => (
                      <path
                        key={j}
                        d={d}
                        stroke="var(--ink)"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
