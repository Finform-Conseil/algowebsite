"use client";
import React, { useCallback, useEffect, useState } from "react";

export function ToolbarScrollAffordances({ viewportRef, label }: {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  label: string;
}) {
  const [desktop, setDesktop] = useState(false);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1025px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const update = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const remaining = el.scrollWidth - el.clientWidth;
    setEdges({
      left: remaining > 2 && el.scrollLeft > 2,
      right: remaining > 2 && el.scrollLeft < remaining - 2,
    });
  }, [viewportRef]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, viewportRef]);

  const scroll = (direction: -1 | 1) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.max(72, Math.round(el.clientWidth * 0.7)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  if (desktop) return null;

  return (
    <>
      {edges.left && <button type="button" className="gp-toolbar-scroll-hint gp-toolbar-scroll-hint--left"
        aria-label={`Défiler vers la gauche : ${label}`} onClick={() => scroll(-1)}>
        <i className="bi bi-chevron-left" aria-hidden="true" />
      </button>}
      {edges.right && <button type="button" className="gp-toolbar-scroll-hint gp-toolbar-scroll-hint--right"
        aria-label={`Défiler vers la droite : ${label}`} onClick={() => scroll(1)}>
        <i className="bi bi-chevron-right" aria-hidden="true" />
      </button>}
    </>
  );
}
