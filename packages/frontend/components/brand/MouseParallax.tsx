"use client";

import { useEffect } from "react";

/**
 * Sets --mouse-x/--mouse-y (each -1..1, relative to viewport center) on <html>, read by the
 * `.utado-parallax` class wrapping each FloatingDiscs disc. Mounted once, site-wide, in the
 * root layout - a single listener rather than one per background instance.
 *
 * Renders nothing; it only ever touches CSS custom properties, never React state, so mouse
 * movement can't trigger a re-render anywhere.
 */
export function MouseParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const root = document.documentElement;
    let targetX = 0;
    let targetY = 0;
    let frame: number | null = null;

    function applyToDom() {
      root.style.setProperty("--mouse-x", targetX.toFixed(4));
      root.style.setProperty("--mouse-y", targetY.toFixed(4));
      frame = null;
    }

    function onMouseMove(e: MouseEvent) {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
      if (frame === null) frame = requestAnimationFrame(applyToDom);
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (frame !== null) cancelAnimationFrame(frame);
      root.style.removeProperty("--mouse-x");
      root.style.removeProperty("--mouse-y");
    };
  }, []);

  return null;
}
