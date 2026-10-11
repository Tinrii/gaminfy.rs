"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.18 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 45%", scrub: 0.5 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <p ref={ref} className={cn(className)}>
      {text.split(" ").map((word, i) => (
        <span key={i} data-word>
          {word}{" "}
        </span>
      ))}
    </p>
  );
}
