"use client";

import { useRef } from "react";
import { useI18n } from "@/i18n/client";
import { INTL_LOCALE } from "@/i18n/config";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/** "40.000+" / "40,000+" / "6" → { n: 40000, suffix: "+" }. Anything else stays static. */
function parse(text: string): { n: number; suffix: string } | null {
  const match = text.trim().match(/^(\d[\d.,\s]*)(\D*)$/);
  if (!match) return null;
  const n = Number(match[1].replace(/[.,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? { n, suffix: match[2] } : null;
}

/**
 * Counts up from 0 the first time it scrolls into view. Takes a number, or a display
 * string such as "40.000+" — the number part counts, the suffix is kept as-is.
 */
export function CountUp({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const { locale } = useI18n();
  const ref = useRef<HTMLSpanElement>(null);
  const parsed = typeof value === "number" ? { n: value, suffix } : parse(value);
  const format = (n: number) => `${Math.round(n).toLocaleString(INTL_LOCALE[locale])}${parsed?.suffix ?? ""}`;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !parsed) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Runs before paint: start at 0 so the final number never flashes first.
        el.textContent = format(0);
        const state = { n: 0 };
        gsap.to(state, {
          n: parsed.n,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: () => {
            el.textContent = format(state.n);
          },
        });
        return () => {
          el.textContent = format(parsed.n);
        };
      });
    },
    { dependencies: [value, suffix, locale] },
  );

  return (
    <span ref={ref} className="tabular-nums">
      {parsed ? format(parsed.n) : value}
    </span>
  );
}
