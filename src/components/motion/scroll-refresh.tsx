"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "./gsap";

/**
 * Streamed content (Suspense), images and fonts change the page height after
 * ScrollTriggers are created — recompute their positions whenever that happens.
 */
export function ScrollRefresh() {
  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
  return null;
}
