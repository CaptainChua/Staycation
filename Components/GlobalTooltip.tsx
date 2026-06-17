"use client";

import { useEffect, useState } from "react";

interface TipState {
  text: string;
  left: number;
  top: number;
  placement: "top" | "bottom";
}

/**
 * GlobalTooltip
 * Replaces the slow, unreliable native `title` tooltip (which only appears after a
 * ~1s hover and resets when the mouse moves) with an instant custom tooltip.
 *
 * It works app-wide via event delegation: on hover, it moves the element's `title`
 * into `data-tooltip` (suppressing the browser's built-in tooltip) and renders a
 * styled tooltip immediately. No per-button changes are required — every element
 * that already has a `title` attribute is covered automatically.
 */
export default function GlobalTooltip() {
  const [tip, setTip] = useState<TipState | null>(null);

  useEffect(() => {
    let activeEl: HTMLElement | null = null;

    const show = (el: HTMLElement) => {
      // Move native title into data-tooltip so the browser's own tooltip never shows
      const native = el.getAttribute("title");
      if (native && native.trim()) {
        el.setAttribute("data-tooltip", native);
        el.removeAttribute("title");
      }

      const text = el.getAttribute("data-tooltip");
      if (!text || !text.trim()) return;

      activeEl = el;
      const rect = el.getBoundingClientRect();
      const placement: "top" | "bottom" = rect.top < 44 ? "bottom" : "top";
      setTip({
        text,
        left: rect.left + rect.width / 2,
        top: placement === "top" ? rect.top : rect.bottom,
        placement,
      });
    };

    const hide = () => {
      activeEl = null;
      setTip(null);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || typeof target.closest !== "function") return;
      const el = target.closest("[title], [data-tooltip]") as HTMLElement | null;
      if (!el || el === activeEl) return;
      show(el);
    };

    const onOut = (e: MouseEvent) => {
      if (!activeEl) return;
      // Ignore movement to a child of the active element (prevents flicker)
      const related = e.relatedTarget as Node | null;
      if (related && activeEl.contains(related)) return;
      hide();
    };

    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);
    // Hide on scroll/click so the tooltip never lingers in the wrong place
    window.addEventListener("scroll", hide, true);
    window.addEventListener("click", hide, true);

    return () => {
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("click", hide, true);
    };
  }, []);

  if (!tip) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: tip.left,
        top: tip.placement === "top" ? tip.top - 8 : tip.top + 8,
        transform:
          tip.placement === "top"
            ? "translate(-50%, -100%)"
            : "translate(-50%, 0)",
        zIndex: 1000000,
      }}
      role="tooltip"
      className="pointer-events-none whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-700"
    >
      {tip.text}
    </div>
  );
}
