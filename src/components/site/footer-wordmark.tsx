"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";

const WORD = "GAMINFY";
const BASE_SIZE = 100; // px — measured once, then scaled to the container width

/** Oversized outlined "GAMINFY" that rises into place as the footer scrolls in. */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  // Fit the word exactly to the container width so it never overflows the screen,
  // whatever the viewport size or font metrics.
  useLayoutEffect(() => {
    const box = ref.current;
    const text = textRef.current;
    if (!box || !text) return;

    const fit = () => {
      const styles = getComputedStyle(box);
      const available = box.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      text.style.fontSize = `${BASE_SIZE}px`;
      const natural = text.scrollWidth;
      if (natural > 0) text.style.fontSize = `${(BASE_SIZE * available) / natural}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-letter]",
          { yPercent: 70, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            ease: "power3.out",
            stagger: 0.05,
            // Scrubbed with the scroll and finished exactly at the bottom of the page
            // ("max"), so the letters always end fully in view on short and long pages.
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "max", scrub: 0.8 },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className="container-page pointer-events-none overflow-hidden select-none">
      {/* Small right padding keeps the italic "Y" overhang inside the measured width. */}
      <p
        ref={textRef}
        className="text-outline inline-flex pr-[0.06em] pb-[0.04em] text-[clamp(4rem,17vw,15rem)] leading-[0.9] font-extrabold tracking-tight whitespace-nowrap italic"
      >
        {WORD.split("").map((ch, i) => (
          <span key={i} data-letter className="inline-block">
            {ch}
          </span>
        ))}
      </p>
    </div>
  );
}
