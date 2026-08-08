"use client";

import { Avatar } from "@/components/avatars/Avatar";
import { ACCENTS, AVATARS } from "@/components/avatars/avatar-set";
import { fileToAvatarPhoto } from "@/lib/avatar-photo";

/**
 * The face-and-colour picker, shared by first-time sign-up and later editing.
 *
 * It's a controlled component: the parent owns the chosen avatar key, photo and
 * accent, and this renders the preview, the drawn set plus an upload tile, and
 * the colour swatches. A photo and a drawn face are one mutually-exclusive
 * choice — picking a face clears the photo, and vice versa.
 */
export function AvatarChooser({
  name,
  avatarKey,
  photo,
  accent,
  onAvatarKey,
  onPhoto,
  onAccent,
  onError,
}: {
  name: string;
  avatarKey: string;
  photo: string | null;
  accent: string;
  onAvatarKey: (key: string) => void;
  onPhoto: (photo: string | null) => void;
  onAccent: (accent: string) => void;
  /** Surfaced when a chosen image can't be read. */
  onError: (message: string | null) => void;
}) {
  async function onPickPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input so re-picking the same file after a removal still fires.
    event.target.value = "";
    if (!file) return;
    onError(null);
    try {
      onPhoto(await fileToAvatarPhoto(file));
    } catch {
      onError("That image wouldn't load — try a different photo.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Avatar avatarKey={avatarKey} accent={accent} photo={photo} size={104} />
        <p className="marker-caps text-2xl">{name}</p>
      </div>

      <fieldset className="border-0 p-0">
        <legend className="mb-3 marker-caps text-xl">Pick your face</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {/* Upload tile. Sits first so "use my own photo" is the obvious
              alternative to the drawn set, not something hidden below it. */}
          <label
            className={`flex cursor-pointer items-center justify-center border-[2.5px] p-1 ${
              photo ? "border-ink bg-primary" : "border-transparent"
            }`}
            style={{ borderRadius: "var(--radius-b)" }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="sr-only"
            />
            {photo ? (
              <Avatar
                avatarKey={avatarKey}
                accent={accent}
                photo={photo}
                size={52}
                title="Your photo"
              />
            ) : (
              <span
                aria-hidden="true"
                className="marker-caps flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full border-[2.5px] border-dashed border-ink text-ink-soft"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs leading-tight">Photo</span>
              </span>
            )}
            <span className="sr-only">Upload your own photo</span>
          </label>

          {AVATARS.map((option) => {
            const selected = !photo && avatarKey === option.key;
            return (
              <label
                key={option.key}
                className={`flex cursor-pointer items-center justify-center border-[2.5px] p-1 ${
                  selected ? "border-ink bg-primary" : "border-transparent"
                }`}
                style={{ borderRadius: "var(--radius-b)" }}
              >
                <input
                  type="radio"
                  name="avatar"
                  value={option.key}
                  checked={selected}
                  // Picking a drawn face drops the photo — the two are one
                  // choice, and a stored photo would otherwise still win.
                  onChange={() => {
                    onAvatarKey(option.key);
                    onPhoto(null);
                  }}
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
            );
          })}
        </div>
        {photo && (
          <button
            type="button"
            onClick={() => onPhoto(null)}
            className="mt-2 min-h-[44px] text-base underline decoration-2 underline-offset-4"
          >
            Remove photo
          </button>
        )}
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
                onChange={() => onAccent(option.key)}
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
    </div>
  );
}
