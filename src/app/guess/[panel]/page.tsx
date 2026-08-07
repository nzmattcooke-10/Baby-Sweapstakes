import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarPanel } from "@/components/toys/CalendarPanel";
import { ClampPanel } from "@/components/toys/ClampPanel";
import { NamePanel } from "@/components/toys/NamePanel";
import { ScalePanel } from "@/components/toys/ScalePanel";
import { SexCards } from "@/components/toys/SexCards";
import { SkyArcPanel } from "@/components/toys/SkyArcPanel";
import {
  LENGTH_DEFAULT_MM,
  WEIGHT_DEFAULT_G,
} from "@/components/baby/morph";
import { Icon } from "@/components/zine/Icon";
import { PANELS, PANEL_META, requireUser, type PanelKey } from "@/lib/data";
import { getWindow } from "@/lib/data";

function isPanel(value: string): value is PanelKey {
  return (PANELS as readonly string[]).includes(value);
}

export default async function PanelPage(props: PageProps<"/guess/[panel]">) {
  const { panel } = await props.params;
  if (!isPanel(panel)) notFound();

  const { participant, guess, sweepstake } = await requireUser();
  if (participant.committedAt) redirect("/board");

  const meta = PANEL_META[panel];
  const window = await getWindow(sweepstake);

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
        <h1 className="marker-caps text-3xl leading-tight">{meta.title}</h1>
      </div>

      {panel === "date" && (
        <CalendarPanel window={window} initial={guess.birthDate} />
      )}
      {panel === "time" && <SkyArcPanel initial={guess.birthMinuteOfDay} />}
      {panel === "weight" && (
        <ScalePanel
          initial={guess.weightGrams}
          lengthMm={guess.lengthMm ?? LENGTH_DEFAULT_MM}
        />
      )}
      {panel === "length" && (
        <ClampPanel
          initial={guess.lengthMm}
          weightGrams={guess.weightGrams ?? WEIGHT_DEFAULT_G}
        />
      )}
      {panel === "sex" && <SexCards initial={guess.sex} />}
      {panel === "name" && (
        <NamePanel initialName={guess.firstName} />
      )}
    </main>
  );
}
