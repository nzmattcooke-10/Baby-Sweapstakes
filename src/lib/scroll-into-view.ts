/**
 * Keep a focused text field visible when the mobile keyboard opens.
 *
 * On Android Chrome the viewport `interactiveWidget: "resizes-content"` already
 * does most of this, but iOS Safari never resizes the layout viewport for the
 * keyboard, so a field low on the page ends up hidden behind it. Scrolling the
 * focused field to the centre of what's left of the viewport puts it back in
 * view on every platform.
 *
 * The delay lets the keyboard finish animating in first — scrolling before the
 * viewport has shrunk lands in the wrong place.
 */
export function scrollFieldIntoView(
  event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
): void {
  const field = event.currentTarget;
  window.setTimeout(() => {
    field.scrollIntoView({ block: "center", behavior: "smooth" });
  }, 300);
}
