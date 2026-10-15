"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/**
 * Infinite horizontal marquee. Children are repeated enough times to cover the
 * container plus one extra copy, and the track slides by exactly one copy's width,
 * so the loop is seamless and never leaves a gap on wide screens — in either
 * direction. Pauses on hover; static with reduced motion.
 */
export function Marquee({
  children,
  reverse,
  duration = 40,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLDivElement>(null);
  const [{ copies, width }, setLayout] = useState({ copies: 2, width: 0 });

  // One copy must always be off-screen to slide in, so: enough to fill the width, plus one.
  useEffect(() => {
    const el = root.current;
    const copy = first.current;
    if (!el || !copy) return;
    const measure = () => {
      const w = copy.offsetWidth;
      if (w > 0) setLayout({ copies: Math.max(2, Math.ceil(el.clientWidth / w) + 1), width: w });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(copy);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const w = width;
        if (!w) return;
        // Speed stays the same however many copies are rendered.
        const tween = gsap.fromTo(
          "[data-track]",
          { x: reverse ? -w : 0 },
          { x: reverse ? 0 : -w, duration, ease: "none", repeat: -1 },
        );
        const el = root.current!;
        const pause = () => tween.pause();
        const play = () => tween.play();
        el.addEventListener("mouseenter", pause);
        el.addEventListener("mouseleave", play);
        return () => {
          el.removeEventListener("mouseenter", pause);
          el.removeEventListener("mouseleave", play);
        };
      });
    },
    { scope: root, dependencies: [copies, width, reverse, duration], revertOnUpdate: true },
  );

  return (
    <div
      ref={root}
      className={cn(
        "overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div data-track className="flex w-max">
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} ref={i === 0 ? first : undefined} className="flex shrink-0 gap-4 pr-4" aria-hidden={i > 0 || undefined}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
