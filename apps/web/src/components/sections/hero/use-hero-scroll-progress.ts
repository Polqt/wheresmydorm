"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Scroll progress (0–1) through a tall container, matching the math from
 * 21st.dev video-scroll-hero (isaiahbjork).
 */
export function useHeroScrollProgress(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setProgress(1);
      return;
    }

    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      const maxScroll = el.offsetHeight - window.innerHeight;
      const p = maxScroll > 0 ? Math.min(scrolled / maxScroll, 1) : 1;
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled, containerRef]);

  return progress;
}
