"use client";

import { useCallback, useId, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/zine/Icon";
import {
  getListView,
  getServerListView,
  subscribe,
  toggleListView,
} from "./view-preference";

/**
 * Every board panel sits in one of these, so the accessibility work happens
 * once instead of six times.
 *
 * The list view is a genuine peer of the picture, not a fallback. It serves
 * screen readers and low vision — and on a narrow phone a sortable table of
 * "who guessed what" is honestly the nicer way to read the board, which is why
 * it's offered as a real choice rather than buried.
 *
 * **Only one of the two views is ever in the accessibility tree.** The original
 * design had the picture permanently `aria-hidden` with a permanently
 * screen-reader-only table beside it, which is wrong twice over: the picture
 * contains the avatar *buttons*, so hiding it created focusable elements that
 * screen readers couldn't see (axe flags this as a serious violation), and
 * keeping both meant announcing every guess twice.
 *
 * What actually makes the picture accessible is that the avatars are real
 * buttons rendered in value order — chronological, or ascending — each labelled
 * with a name and a guess. Their DOM order is meaningful even though their
 * pixel positions aren't, so they read correctly on their own. The decorative
 * parts inside (artwork, axis ticks, grid numbers) are individually
 * `aria-hidden`; the interactive parts are not.
 */

export type PanelRow = {
  id: string;
  cells: React.ReactNode[];
};

export function PanelShell({
  title,
  icon,
  summary,
  columns,
  rows,
  box = "drawn",
  children,
}: {
  title: string;
  icon: IconName;
  /** Sits under the title in *both* views, so a winner badge survives the
      picture/list toggle. Takes markup, not just a string, for that reason. */
  summary?: React.ReactNode;
  columns: string[];
  rows: PanelRow[];
  /** Which of the four drawn rectangles to use, so a stack doesn't repeat. */
  box?: "drawn" | "drawn-b" | "drawn-c" | "drawn-d";
  children: React.ReactNode;
}) {
  const headingId = useId();

  const listView = useSyncExternalStore(
    subscribe,
    useCallback(() => getListView(title), [title]),
    getServerListView,
  );

  function toggle() {
    toggleListView(title);
  }

  return (
    <section aria-labelledby={headingId} className={`${box} px-4 py-4`}>
      {/* The heading gets the full width of its own row. Sharing a row with
          the view toggle squeezed two-word titles onto two lines, and the
          marker face is wide enough that a wrapped title reads as a mistake. */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Icon name={icon} size={26} className="shrink-0" />
            <h2 id={headingId} className="marker-caps text-2xl leading-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={listView}
            className="drawn-d marker-caps min-h-[46px] shrink-0 px-3 text-base"
          >
            <span className="sr-only">
              {listView ? "Show this panel as a picture" : "Show this panel as a list"}
            </span>
            <span aria-hidden="true">
            {listView ? "Picture" : "List"}
            </span>
          </button>
        </div>
        {/* A div, not a p: the summary can now carry a winner badge. */}
        {summary && <div className="mt-2 text-base text-ink-soft">{summary}</div>}
      </div>

      {/* The picture, with its avatar buttons left reachable and announced. */}
      <div hidden={listView}>{children}</div>

      {/* The same data as a table. `hidden` rather than sr-only, so the two
          views never both sit in the accessibility tree at once. */}
      <div
        hidden={!listView}
        className="overflow-x-auto"
        tabIndex={listView ? 0 : -1}
        role="region"
        aria-label={`${title}, list view`}
      >
        <table className="w-full text-left text-base">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="marker-caps pb-2 pr-3 text-lg"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t-2 border-dotted border-line">
                {row.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={`py-2.5 pr-3 ${index > 0 ? "font-semibold" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
