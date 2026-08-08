"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { AvatarChooser } from "@/components/avatars/AvatarChooser";
import { resolveAccent } from "@/components/avatars/avatar-set";
import { updateProfile } from "@/app/actions";
import type { Participant } from "@/db/schema";
import { scrollFieldIntoView } from "@/lib/scroll-into-view";

/**
 * Edit your name and face after joining. Pre-filled from the current row; the
 * stored accent is resolved back to its key so the right swatch starts selected
 * even for a legacy hex value. On success the action redirects to the board, so
 * reaching past `startTransition` always means an error to show.
 */
export function ProfileForm({ participant }: { participant: Participant }) {
  const [name, setName] = useState(participant.displayName);
  const [avatarKey, setAvatarKey] = useState(participant.avatarKey);
  const [photo, setPhoto] = useState<string | null>(participant.avatarPhoto);
  const [accent, setAccent] = useState(resolveAccent(participant.accentColor).key);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameId = useId();

  function save() {
    if (name.trim().length < 2) {
      setError("Your name needs at least two letters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(name, avatarKey, accent, photo);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="drawn-b border-danger px-4 py-3 text-center text-base font-semibold text-danger"
        >
          {error}
        </p>
      )}
      {!error && <p role="alert" aria-live="assertive" className="sr-only" />}

      <div className="flex flex-col gap-3">
        <label htmlFor={nameId} className="marker-caps text-xl">
          Your name
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          autoComplete="name"
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
          onFocus={scrollFieldIntoView}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="field min-h-[58px] px-4 text-xl"
        />
      </div>

      <AvatarChooser
        name={name}
        avatarKey={avatarKey}
        photo={photo}
        accent={accent}
        onAvatarKey={setAvatarKey}
        onPhoto={setPhoto}
        onAccent={setAccent}
        onError={setError}
      />

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="filled marker-caps flex min-h-[54px] items-center justify-center gap-2 px-6 text-xl"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
      <Link
        href="/board"
        className="min-h-[46px] text-center text-base underline decoration-2 underline-offset-4"
      >
        Cancel
      </Link>
    </div>
  );
}
