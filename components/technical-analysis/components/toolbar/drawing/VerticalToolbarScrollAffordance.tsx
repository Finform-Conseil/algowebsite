"use client";
import React, { useCallback, useEffect, useState } from "react";

export function VerticalToolbarScrollAffordance({ viewportRef, direction }: {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  direction: "up" | "down";
}) {
  const [visible, setVisible] = useState(false);
  const update = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.clientHeight;
    setVisible(remaining > 2 && (direction === "up" ? el.scrollTop > 2 : el.scrollTop < remaining - 2));
  }, [direction, viewportRef]);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, viewportRef]);
  const scroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({
      top: (direction === "up" ? -1 : 1) * Math.max(76, Math.round(el.clientHeight * .4)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };
  return (
    <button type="button" className="gp-vertical-scroll-hint"
      aria-label={direction === "up" ? "Défiler les outils vers le haut" : "Défiler les outils vers le bas"}
      tabIndex={visible ? 0 : -1} disabled={!visible} onClick={scroll}>
      <i className={direction === "up" ? "bi bi-chevron-up" : "bi bi-chevron-down"} aria-hidden="true" />
    </button>
  );
}
