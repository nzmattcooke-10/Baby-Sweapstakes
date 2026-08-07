"use client";

import { useState, useTransition } from "react";
import { commitGuesses } from "@/app/guess/actions";
import { Icon } from "@/components/zine/Icon";

/**
 * Requires an explicit acknowledgement before the button becomes live.
 *
 * This is the only irreversible action a participant can take, and the reason
 * it's irreversible is the whole basis of the game being fair — so it gets a
 * deliberate checkbox rather than a modal people dismiss on reflex.
 */
export function CommitButton() {
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="drawn-b px-4 py-3 text-center text-base font-semibold text-danger"
        >
          {error}
        </p>
      ) : (
        <p role="alert" aria-live="assertive" className="sr-only" />
      )}

      <label className="drawn-c flex cursor-pointer items-start gap-3 px-4 py-4">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-0.5 h-7 w-7 shrink-0 accent-[var(--hl-teal)]"
        />
        <span className="text-lg leading-snug">
          I understand these are final. Once I lock in I&rsquo;ll see
          everyone&rsquo;s guesses, and I won&rsquo;t be able to change mine.
        </span>
      </label>

      <button
        type="button"
        disabled={!understood || pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await commitGuesses();
            if (result && !result.ok) setError(result.error);
          });
        }}
        className="filled marker-caps flex min-h-[66px] items-center justify-center gap-3 px-6 text-xl"
      >
        {pending ? "Locking in…" : "Lock in my guesses"}
        {!pending && <Icon name="sealed" size={28} strokeWidth={2.4} />}
      </button>
    </div>
  );
}
