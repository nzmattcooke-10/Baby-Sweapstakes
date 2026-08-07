"use client";

import { useId, useState, useTransition } from "react";
import { Avatar } from "@/components/avatars/Avatar";
import { ACCENTS, AVATARS } from "@/components/avatars/avatar-set";
import { checkName, register, signIn } from "@/app/actions";
import { Icon } from "@/components/zine/Icon";
import { PIN_LENGTH } from "@/lib/pin";

type Step = "name" | "avatar" | "pin" | "signin";

const BUTTON =
  "filled marker-caps flex min-h-[54px] items-center justify-center gap-2 px-6 text-xl";

export function JoinFlow() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [avatarKey, setAvatarKey] = useState(AVATARS[0].key);
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
          : await register(name, avatarKey, accent, pin);
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
            What should we call you?
          </label>
          <p id={`${nameId}-help`} className="text-base text-ink-soft">
            However the family knows you — &ldquo;Nana Joy&rdquo;, &ldquo;Uncle
            Dave&rdquo;.
          </p>
          <input
            id={nameId}
            type="text"
            value={name}
            autoComplete="name"
            maxLength={30}
            aria-describedby={`${nameId}-help`}
            onChange={(e) => setName(e.target.value)}
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
          <div className="flex flex-col items-center gap-2">
            <Avatar avatarKey={avatarKey} accent={accent} size={104} />
            <p className="marker-caps text-2xl">{name}</p>
          </div>

          <fieldset className="border-0 p-0">
            <legend className="mb-3 marker-caps text-xl">Pick your face</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {AVATARS.map((option) => (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-center justify-center border-[2.5px] p-1 ${
                    avatarKey === option.key
                      ? "border-ink bg-primary"
                      : "border-transparent"
                  }`}
                  style={{ borderRadius: "var(--radius-b)" }}
                >
                  <input
                    type="radio"
                    name="avatar"
                    value={option.key}
                    checked={avatarKey === option.key}
                    onChange={() => setAvatarKey(option.key)}
                    className="sr-only"
                  />
                  {/* The description is the accessible name — this is the one
                      place the pictures actually need describing. */}
                  <Avatar
                    avatarKey={option.key}
                    accent={accent}
                    size={52}
                    title={option.label}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="mb-3 marker-caps text-xl">And a colour</legend>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((option) => (
                <label
                  key={option.key}
                  className={`flex min-h-[46px] min-w-[46px] cursor-pointer items-center justify-center border-[2.5px] ${
                    accent === option.key ? "border-ink" : "border-transparent"
                  }`}
                  style={{ borderRadius: "var(--radius-c)" }}
                >
                  <input
                    type="radio"
                    name="accent"
                    value={option.key}
                    checked={accent === option.key}
                    onChange={() => setAccent(option.key)}
                    className="sr-only"
                  />
                  {/* The shaded twins share a hex, so the swatch has to show
                      the pencil mark or half the choices look identical. */}
                  <span
                    aria-hidden="true"
                    className="block h-8 w-8 border-[2px] border-ink"
                    style={{
                      background:
                        option.pattern === "hatch"
                          ? `repeating-linear-gradient(-38deg, #111 0 1.5px, transparent 1.5px 5px), ${option.hex}`
                          : option.hex,
                      borderRadius: "var(--radius-tick)",
                    }}
                  />
                  <span className="sr-only">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

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
