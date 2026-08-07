"use client";

import { useState } from "react";
import { saveName } from "@/app/guess/actions";
import { Icon } from "@/components/zine/Icon";
import { SaveBar } from "./SaveBar";

/**
 * Deliberately the one panel with no toy.
 *
 * The secrecy note isn't an apology for that — it's the point. Turning the
 * restriction into a visible bit of mischief makes the plainest screen in the
 * flow one of the more memorable ones.
 */
export function NamePanel({ initialName }: { initialName: string | null }) {
  const [name, setName] = useState(initialName ?? "");

  return (
    <div className="flex flex-col gap-8">
      <div className="drawn flex items-start gap-3 px-4 py-4">
        <Icon name="sealed" size={32} className="mt-0.5 shrink-0" />
        <p className="text-lg leading-snug">
          Everyone&rsquo;s name guesses stay hidden — even after you lock in —
          until the baby&rsquo;s name is announced.{" "}
          <span className="hl hl-teal">No influencing the parents.</span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="firstName" className="marker-caps text-2xl">
          Your name guess
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          autoComplete="off"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name only"
          className="field min-h-[58px] px-4 text-xl"
        />
      </div>

      <SaveBar
        onSave={() => saveName(name)}
        disabled={name.trim().length === 0}
        disabledHint="Type a name to carry on."
      />
    </div>
  );
}
