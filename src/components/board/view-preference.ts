/**
 * Remembers, per panel, whether you last looked at the picture or the list.
 *
 * A tiny external store rather than `useState` + `useEffect`, for two reasons.
 * Reading localStorage during render breaks server rendering, and reading it in
 * an effect means calling setState from an effect — which React 19 rightly
 * flags, because it renders once with the wrong answer and then again with the
 * right one. `useSyncExternalStore` is built for exactly this: a server
 * snapshot for the first paint, and the real value from then on.
 *
 * Per panel rather than global, because wanting the calendar as a picture and
 * the weights as a table is a perfectly reasonable combination.
 */

const PREFIX = "boardListView:";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getListView(panel: string): boolean {
  try {
    return localStorage.getItem(PREFIX + panel) === "1";
  } catch {
    // Private browsing, or storage disabled — the picture is a fine default.
    return false;
  }
}

/** Always the picture on the server, so the first paint matches. */
export function getServerListView(): boolean {
  return false;
}

export function toggleListView(panel: string): void {
  try {
    localStorage.setItem(PREFIX + panel, getListView(panel) ? "0" : "1");
  } catch {
    // Not being able to remember the choice shouldn't stop you making it.
  }
  emit();
}
