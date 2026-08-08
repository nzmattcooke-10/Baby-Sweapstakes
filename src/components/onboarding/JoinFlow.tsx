"use client";

import { useId, useState, useTransition } from "react";
import { AvatarChooser } from "@/components/avatars/AvatarChooser";
import { ACCENTS, AVATARS } from "@/components/avatars/avatar-set";
import { checkName, register, signIn } from "@/app/actions";
import { Icon } from "@/components/zine/Icon";
import { PIN_LENGTH } from "@/lib/pin";
import { scrollFieldIntoView } from "@/lib/scroll-into-view";

type Step = "name" | "avatar" | "pin" | "signin";

const BUTTON =
  "filled marker-caps flex min-h-[54px] items-center justify-center gap-2 px-6 text-xl";

export function JoinFlow() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [avatarKey, setAvatarKey] = useState(AVATARS[0].key);
  const [photo, setPhoto] = useState<string | null>(null);
  const [accent, setAccent] = useState<string>(ACCENTS[0].key);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameId = useId();
  const pinId = useId();

  function continueFromName() {
    // Deliberately not gated behind `disabled`. This is the only action on the
    // page, and a CTA that renders inert at first paint reads as broken; a
    // named problem after a tap is friendlier than a dead button.
    if (name.trim().length < 2) {
      setError("Type the name the family knows you by — at least two letters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await checkName(name);
      if (result.status === "invalid") setError(result.error);
      // A taken name almost always means "this is me, coming back" rather than
      // a collision, so we head straight for the PIN prompt instead of making
      // people find a separate sign-in link.
      else if (result.status === "taken") setStep("signin");
      else setStep("avatar");
    });
  }

  function submitPin() {
    setError(null);
    startTransition(async () => {
      const result =
        step === "signin"
          ? await signIn(name, pin)
          : await register(name, avatarKey, accent, pin, photo);
      // Both redirect on success, so reaching here always means a failure.
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
      {!error && (
        <p role="alert" aria-live="assertive" className="sr-only" />
      )}

      {step === "name" && (
        <div className="flex flex-col gap-3">
          <label htmlFor={nameId} className="marker-caps text-2xl">
            Sign in to play
          </label>
          <p id={`${nameId}-help`} className="text-base text-ink-soft">
            Enter your name below.
          </p>
          <input
            id={nameId}
            type="text"
            value={name}
            autoComplete="name"
            maxLength={30}
            aria-describedby={`${nameId}-help`}
            onChange={(e) => setName(e.target.value)}
            onFocus={scrollFieldIntoView}
            onKeyDown={(e) => e.key === "Enter" && continueFromName()}
            className="field min-h-[58px] px-4 text-xl"
          />
          <button
            type="button"
            onClick={continueFromName}
            disabled={pending}
            className={BUTTON}
          >
            Next
            <Icon name="arrow" size={26} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {step === "avatar" && (
        <div className="flex flex-col gap-6">
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
            onClick={() => setStep("pin")}
            className={BUTTON}
          >
            That&rsquo;s me
          </button>
        </div>
      )}

      {(step === "pin" || step === "signin") && (
        <div className="flex flex-col gap-3">
          <label htmlFor={pinId} className="marker-caps text-2xl">
            {step === "signin"
              ? `Welcome back, ${name}. What's your PIN?`
              : "Choose a 4-digit PIN"}
          </label>
          <p id={`${pinId}-help`} className="text-base text-ink-soft">
            {step === "signin"
              ? "The four digits you picked when you joined."
              : "You'll need it to come back and finish your guesses. Don't use 1234."}
          </p>
          <input
            id={pinId}
            type="password"
            inputMode="numeric"
            autoComplete={step === "signin" ? "current-password" : "new-password"}
            pattern="[0-9]*"
            maxLength={PIN_LENGTH}
            value={pin}
            aria-describedby={`${pinId}-help`}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onFocus={scrollFieldIntoView}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            className="field min-h-[64px] px-4 text-center text-4xl tracking-[0.45em]"
          />
          <button
            type="button"
            onClick={submitPin}
            disabled={pending || pin.length !== PIN_LENGTH}
            className={BUTTON}
          >
            {pending ? "One moment…" : step === "signin" ? "Sign in" : "Let's go"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPin("");
              setError(null);
              setStep("name");
            }}
            className="min-h-[46px] text-base underline decoration-2 underline-offset-4"
          >
            {step === "signin" ? "That's not me — use another name" : "Back"}
          </button>
        </div>
      )}
    </div>
  );
}
