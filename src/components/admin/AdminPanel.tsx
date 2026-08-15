"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatars/Avatar";
import {
  changeAdminPin,
  closeEntries,
  deleteUser,
  reopenEntries,
  resetPin,
  saveResult,
  setPaid,
  updateSettings,
  type AdminResult,
} from "@/app/admin/actions";
import type { Participant, Result, Sweepstake } from "@/db/schema";
import { Icon } from "@/components/zine/Icon";
import { formatMoney } from "@/lib/units";

/**
 * Built for one specific moment: the host, in a hospital, tired, one-handed,
 * on bad reception. So "Close entries" is an enormous button at the very top
 * with no confirmation chain, the result form saves partial answers, and
 * nothing important is more than one tap deep.
 */

function useAction() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<AdminResult>, success = "Saved.") {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? success : result.error);
    });
  }

  return { pending, message, run };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="drawn-b px-4 py-4">
      <h2 className="marker-caps mb-3 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export function AdminPanel({
  sweepstake,
  result,
  participants,
}: {
  sweepstake: Sweepstake;
  result: Result | null;
  participants: Participant[];
}) {
  const { pending, message, run } = useAction();
  const entriesOpen = sweepstake.status === "open";

  const paidCount = participants.filter((p) => p.hasPaid).length;
  const pot = paidCount * sweepstake.buyInCents;

  return (
    <div className="flex flex-col gap-4">
      <p
        role="status"
        aria-live="polite"
        className="min-h-[1.5rem] text-center text-base"
      >
        {message}
      </p>

      {/* The one that matters. */}
      {entriesOpen ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(closeEntries, "Entries are closed.")}
          className="filled marker-caps min-h-[104px] px-6 text-3xl leading-tight text-balance"
        >
          Close entries now
        </button>
      ) : (
        <div className="drawn px-4 py-4 text-center">
          <p className="marker-caps text-2xl">Entries are closed</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(reopenEntries, "Entries are open again.")}
            className="mt-2 min-h-[44px] text-base underline decoration-2 underline-offset-4"
          >
            Reopen them
          </button>
        </div>
      )}

      <ResultForm result={result} pending={pending} run={run} />

      <Section title={`The pot — ${formatMoney(pot, sweepstake.currency)}`}>
        <p className="mb-3 text-sm text-ink-soft">
          {paidCount} of {participants.length} paid ·{" "}
          {formatMoney(sweepstake.buyInCents, sweepstake.currency)} each. The app
          never touches money; this is just a tally.
        </p>
        <ul className="flex flex-col gap-2">
          {participants.map((person) => (
            // Below `sm` the person takes a whole row and the controls wrap
            // underneath. `flex-1` alone was not enough: it lets the name
            // shrink toward nothing rather than forcing the wrap, which is how
            // "Grandad Rob" ended up stacked one word per line beside the
            // wider marker-caps buttons.
            <li
              key={person.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2"
            >
              <span className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
                <Avatar
                  avatarKey={person.avatarKey}
                  accent={person.accentColor}
                  photo={person.avatarPhoto}
                  size={32}
                />
                <span className="min-w-0 flex-1 text-base">
                  {person.displayName}
                  {!person.committedAt && (
                    <span className="text-ink-soft"> · not locked in</span>
                  )}
                </span>
              </span>
              {/* A drawn tick box, the same mark the tally uses. The native
                  control stays underneath for keyboard and assistive tech; only
                  its rendering is replaced, because system-blue was the one
                  colour on the page outside the law. */}
              <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-base">
                <input
                  type="checkbox"
                  checked={person.hasPaid}
                  disabled={pending}
                  onChange={(e) =>
                    run(() => setPaid(person.id, e.target.checked), "Updated.")
                  }
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center border-[2.5px] border-ink peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]"
                  style={{
                    borderRadius: "var(--radius-tick-b)",
                    background: person.hasPaid ? "var(--hl-yellow)" : "transparent",
                    color: "#111",
                  }}
                >
                  {person.hasPaid && (
                    <Icon name="tick" size={18} strokeWidth={2.8} />
                  )}
                </span>
                Paid
              </label>
              <PinResetButton participantId={person.id} run={run} />
              <DeleteUserButton
                participantId={person.id}
                name={person.displayName}
                run={run}
              />
            </li>
          ))}
        </ul>
      </Section>

      <SettingsForm sweepstake={sweepstake} pending={pending} run={run} />
    </div>
  );
}

function PinResetButton({
  participantId,
  run,
}: {
  participantId: string;
  run: (action: () => Promise<AdminResult>, success?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="drawn-d marker-caps min-h-[44px] px-3 text-base"
      >
        Reset PIN
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <label className="sr-only" htmlFor={`pin-${participantId}`}>
        New PIN
      </label>
      <input
        id={`pin-${participantId}`}
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="field w-20 px-2 py-1 text-center"
      />
      <button
        type="button"
        onClick={() => {
          run(() => resetPin(participantId, pin), `PIN set to ${pin}.`);
          setOpen(false);
          setPin("");
        }}
        className="filled-b marker-caps min-h-[44px] px-3 text-base"
      >
        Set
      </button>
    </span>
  );
}

/**
 * Deleting a player wipes their guesses for good, so it can't be a single tap
 * like the rest of the panel. The first tap only arms it; the destructive
 * action lives behind a distinct confirm, with a way back out.
 */
function DeleteUserButton({
  participantId,
  name,
  run,
}: {
  participantId: string;
  name: string;
  run: (action: () => Promise<AdminResult>, success?: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="drawn-d marker-caps min-h-[44px] px-3 text-base text-danger"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          run(() => deleteUser(participantId), `Deleted ${name}.`);
          setConfirming(false);
        }}
        className="filled marker-caps min-h-[44px] px-3 text-base"
        style={{ background: "var(--danger)", color: "#fff" }}
      >
        Delete for good
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="drawn-d marker-caps min-h-[44px] px-3 text-base"
      >
        Keep
      </button>
    </span>
  );
}

function ResultForm({
  result,
  pending,
  run,
}: {
  result: Result | null;
  pending: boolean;
  run: (action: () => Promise<AdminResult>, success?: string) => void;
}) {
  const [date, setDate] = useState(result?.actualDate ?? "");
  const [time, setTime] = useState(
    result?.actualMinuteOfDay != null
      ? `${String(Math.floor(result.actualMinuteOfDay / 60)).padStart(2, "0")}:${String(
          result.actualMinuteOfDay % 60,
        ).padStart(2, "0")}`
      : "",
  );
  const [kg, setKg] = useState(
    result?.actualWeightGrams != null
      ? (result.actualWeightGrams / 1000).toFixed(2)
      : "",
  );
  const [cm, setCm] = useState(
    result?.actualLengthMm != null ? (result.actualLengthMm / 10).toFixed(1) : "",
  );
  const [sex, setSex] = useState<"" | "boy" | "girl">(result?.actualSex ?? "");
  const [babyName, setBabyName] = useState(result?.actualName ?? "");

  function submit() {
    const [h, m] = time.split(":").map(Number);
    run(
      () =>
        saveResult({
          actualDate: date || null,
          actualMinuteOfDay: time ? h * 60 + m : null,
          actualWeightGrams: kg ? Math.round(Number(kg) * 1000) : null,
          actualLengthMm: cm ? Math.round(Number(cm) * 10) : null,
          actualSex: sex || null,
          actualName: babyName || null,
        }),
      "Result saved — the scores are live.",
    );
  }

  return (
    <Section title="The actual baby">
      <p className="mb-3 text-sm text-ink-soft">
        Fill in whatever you know. Each category scores as soon as it&rsquo;s
        here, so put the date and time in now and come back for the weight.
      </p>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Baby&rsquo;s name (for the announcement)
          <input
            type="text"
            value={babyName}
            maxLength={40}
            placeholder="Eleanor"
            onChange={(e) => setBabyName(e.target.value)}
            className="min-h-[48px] field px-3 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Date of birth
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[48px] field px-3 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Time of birth
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="min-h-[48px] field px-3 text-lg"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            Weight (kg)
            <input
              inputMode="decimal"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder="3.40"
              className="min-h-[48px] field px-3 text-lg"
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            Length (cm)
            <input
              inputMode="decimal"
              value={cm}
              onChange={(e) => setCm(e.target.value)}
              placeholder="50.0"
              className="min-h-[48px] field px-3 text-lg"
            />
          </label>
        </div>

        <fieldset className="border-0 p-0">
          <legend className="mb-1 text-sm">Boy or girl</legend>
          <div className="flex gap-2">
            {(["girl", "boy"] as const).map((option) => (
              <label
                key={option}
                className={`${
                  sex === option ? "drawn-b" : "drawn-d"
                } marker-caps flex min-h-[50px] flex-1 cursor-pointer items-center justify-center text-xl`}
                style={
                  sex === option
                    ? { background: "var(--hl-yellow)", color: "#111" }
                    : undefined
                }
              >
                <input
                  type="radio"
                  name="actualSex"
                  checked={sex === option}
                  onChange={() => setSex(option)}
                  className="sr-only"
                />
                {option === "girl" ? "A girl" : "A boy"}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="filled marker-caps min-h-[58px] px-6 text-xl"
        >
          Save the result
        </button>
      </div>
    </Section>
  );
}

function SettingsForm({
  sweepstake,
  pending,
  run,
}: {
  sweepstake: Sweepstake;
  pending: boolean;
  run: (action: () => Promise<AdminResult>, success?: string) => void;
}) {
  const [dueDate, setDueDate] = useState(sweepstake.dueDate);
  const [calendarEnd, setCalendarEnd] = useState(sweepstake.calendarEnd);
  const [buyIn, setBuyIn] = useState((sweepstake.buyInCents / 100).toFixed(2));
  const [adminPin, setAdminPin] = useState("");

  return (
    <Section title="Settings">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="min-h-[48px] field px-3 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Guessing window ends
          <input
            type="date"
            value={calendarEnd}
            onChange={(e) => setCalendarEnd(e.target.value)}
            className="min-h-[48px] field px-3 text-lg"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Buy-in ({sweepstake.currency})
          <input
            inputMode="decimal"
            value={buyIn}
            onChange={(e) => setBuyIn(e.target.value)}
            className="min-h-[48px] field px-3 text-lg"
          />
        </label>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() =>
              updateSettings({
                dueDate,
                calendarEnd,
                buyInCents: Math.round(Number(buyIn) * 100),
                currency: sweepstake.currency,
              }),
            )
          }
          className="drawn-c marker-caps min-h-[52px] px-4 text-xl"
        >
          Save settings
        </button>

        <hr className="border-line" />

        <label className="flex flex-col gap-1 text-sm">
          Change the host PIN
          <input
            inputMode="numeric"
            maxLength={4}
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ""))}
            placeholder="New 4 digits"
            className="field marker-caps min-h-[48px] px-3 text-xl"
          />
        </label>
        <button
          type="button"
          disabled={pending || adminPin.length !== 4}
          onClick={() => {
            run(() => changeAdminPin(adminPin), "Host PIN changed.");
            setAdminPin("");
          }}
          className="drawn-d marker-caps min-h-[52px] px-4 text-xl"
        >
          Change host PIN
        </button>
      </div>
    </Section>
  );
}
