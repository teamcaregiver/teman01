import type { KeyboardEvent, MouseEvent } from "react";

// Clicks on these keep their own action instead of opening the row.
const INTERACTIVE =
  "a,button,input,textarea,select,label,[role='checkbox'],[role='combobox'],[role='menuitem']";

/** Classes for a row or card opened by `openOnClick`. */
export const OPENABLE_CLASS =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring";

/**
 * Lets a whole table row or card open its detail like a link: click, Enter
 * or Space. Buttons, links and inputs inside it still do their own thing,
 * and selecting text in it does not open it.
 */
export function openOnClick(open: () => void, label: string) {
  return {
    tabIndex: 0,
    "aria-label": label,
    onClick: (e: MouseEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      // A dialog opened from inside the row sits elsewhere in the page, but
      // its clicks still bubble here through React; they are not row clicks.
      if (!e.currentTarget.contains(target)) return;
      const hit = target.closest(INTERACTIVE);
      if (hit && e.currentTarget.contains(hit)) return;
      if (window.getSelection()?.toString()) return;
      open();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    },
  };
}
