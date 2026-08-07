/**
 * The running commentary that reacts as you move each slider. This is the
 * single most charming detail in the guessing flow, so the copy lives in one
 * place where it can be read as a whole and kept in one voice.
 *
 * Tone rules, deliberately:
 *
 * - The early end of the calendar stays *teasing*, never alarmed. "Woah, it's
 *   coming early!" reads very differently to a family who have lived through a
 *   premature birth. Our window only reaches about a week before term, so
 *   nothing here is anywhere near worrying territory — but the copy shouldn't
 *   introduce worry the dates don't warrant.
 * - Weight and length commentary is about the *baby*, never about the person
 *   carrying them. No "good luck to mum" at the heavy end.
 *
 * Emoji live in their own field so components can render them aria-hidden.
 * Screen readers announcing "grinning face with smiling eyes" mid-sentence
 * turns a joke into noise.
 */

export type Remark = { emoji: string; text: string };

/** Keyed to days from the due date: negative early, positive late. */
export function dateRemark(offsetFromDue: number): Remark {
  if (offsetFromDue <= -6)
    return { emoji: "🏃", text: "An early bird! Are the bags even packed?" };
  if (offsetFromDue <= -3)
    return { emoji: "👀", text: "A good week early — keen to meet everyone." };
  if (offsetFromDue <= -1)
    return { emoji: "🙂", text: "Just a nudge ahead of schedule." };
  if (offsetFromDue === 0)
    return { emoji: "🎯", text: "Bang on the due date. Bold move." };
  if (offsetFromDue <= 2)
    return { emoji: "😌", text: "Fashionably late. Very stylish." };
  if (offsetFromDue <= 5)
    return { emoji: "🛋️", text: "Settling in and taking their sweet time." };
  if (offsetFromDue <= 9)
    return { emoji: "😴", text: "Extremely comfy in there, apparently." };
  return { emoji: "🚫", text: "Point blank refusing to leave. Respect." };
}

export function weightRemark(grams: number): Remark {
  if (grams < 2500) return { emoji: "🐣", text: "A tiny wee bundle." };
  if (grams < 3000) return { emoji: "🌸", text: "Petite and perfect." };
  if (grams < 3600) return { emoji: "👶", text: "Right around average." };
  if (grams < 4200) return { emoji: "💪", text: "A good solid chunk." };
  if (grams < 5000) return { emoji: "🏋️", text: "A proper heavyweight." };
  return { emoji: "🤨", text: "Are we certain that's not a toddler?" };
}

export function lengthRemark(mm: number): Remark {
  if (mm < 450) return { emoji: "🫘", text: "Compact little thing." };
  if (mm < 490) return { emoji: "📏", text: "Nice and neat." };
  if (mm < 530) return { emoji: "👌", text: "Textbook." };
  if (mm < 570) return { emoji: "🦒", text: "Look at those long little limbs." };
  return { emoji: "🏀", text: "Basketball scholarship incoming." };
}

export function timeRemark(minuteOfDay: number): Remark {
  const hour = minuteOfDay / 60;
  if (hour < 4)
    return { emoji: "🦉", text: "The small hours. Nobody's getting sleep." };
  if (hour < 7) return { emoji: "🌅", text: "A sunrise baby. Poetic." };
  if (hour < 12) return { emoji: "☕", text: "Morning arrival — civilised." };
  if (hour < 17) return { emoji: "☀️", text: "Straight through the afternoon." };
  if (hour < 21) return { emoji: "🌆", text: "Just in time to ruin dinner." };
  return { emoji: "🌙", text: "A late-night entrance." };
}
