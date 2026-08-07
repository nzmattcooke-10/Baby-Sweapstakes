"use client";

import { useState } from "react";
import { saveSex } from "@/app/guess/actions";
import { BabySvg } from "@/components/baby/BabySvg";
import { Icon } from "@/components/zine/Icon";
import { SaveBar } from "./SaveBar";

/**
 * Two cards, same baby, one in a bonnet and one in a cap.
 *
 * Underneath the styling this is a plain radio group, which is what makes it
 * work with a keyboard (arrow keys move between the two) and with a screen
 * reader, for free. The label text carries the meaning — the bonnet and cap
 * are reinforcement, so this never depends on telling pink from blue.
 *
 * There is deliberately no running tally of how the family has voted. That
 * would leak which way the board is leaning before you've committed.
 */
export function SexCards({ initial }: { initial: "boy" | "girl" | null }) {
  const [choice, setChoice] = useState<"boy" | "girl" | null>(initial);

  const options = [
    { value: "girl" as const, label: "A girl", headwear: "bonnet" as const },
    { value: "boy" as const, label: "A boy", headwear: "cap" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      <fieldset className="border-0 p-0">
        <legend className="mb-4 marker-caps text-center text-2xl">
          What&rsquo;s your hunch?
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {options.map((option) => {
            const selected = choice === option.value;
            return (
              <label
                key={option.value}
                className={`${selected ? "plate" : "plate-b"} flex cursor-pointer flex-col items-center gap-2 px-3 py-4 transition-transform ${
                  selected ? "-translate-y-1.5" : ""
                }`}
                style={
                  selected
                    ? { background: "var(--hl-yellow)" }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="sex"
                  value={option.value}
                  checked={selected}
                  onChange={() => setChoice(option.value)}
                  className="sr-only"
                />
                <BabySvg
                  weightGrams={3400}
                  lengthMm={500}
                  headwear={option.headwear}
                  armPose={selected ? "wave" : "down"}
                  width={130}
                />
                <span className="marker-caps text-2xl">{option.label}</span>
                <span
                  aria-hidden="true"
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    selected ? "" : "invisible"
                  }`}
                >
                  <Icon name="tick" size={18} strokeWidth={2.8} />
                  picked
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <SaveBar
        onSave={() => saveSex(choice as "boy" | "girl")}
        disabled={choice === null}
        disabledHint="Pick one to carry on."
      />
    </div>
  );
}
