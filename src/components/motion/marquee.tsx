"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/**
 * Infinite horizontal marquee. Children are rendered twice and the track slides by
 * half its width, so the loop is seamless. Pauses on hover; static with reduced motion.
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

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tween = gsap.fromTo(
          "[data-track]",
          { xPercent: reverse ? -50 : 0 },
          { xPercent: reverse ? 0 : -50, duration, ease: "none", repeat: -1 },
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
    { scope: root },
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
        <div className="flex shrink-0 gap-4 pr-4">{children}</div>
        <div className="flex shrink-0 gap-4 pr-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
