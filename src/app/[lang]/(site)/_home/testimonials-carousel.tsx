"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 4500;
/** Most cards on screen at once (xl). Also how many are cloned at the end for a seamless loop. */
const MAX_VISIBLE = 4;

/**
 * One row of testimonial cards: 1 / 2 / 3 / 4 visible depending on width. Every few
 * seconds the row slides by one card — the leftmost leaves, a new one enters on the
 * right. Pauses on hover/focus; no autoplay with reduced motion.
 */
export function TestimonialsCarousel({ children }: { children: React.ReactNode }) {
  const { dict } = useI18n();
  const items = Children.toArray(children);
  const n = items.length;

  const viewport = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  // Distance of one slide = card width + gap, re-measured on resize/breakpoints.
  useEffect(() => {
    const el = viewport.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return;
    const measure = () => {
      const gap = parseFloat(getComputedStyle(card.parentElement!).columnGap) || 0;
      setStep(card.offsetWidth + gap);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Jumps without animation (used to wrap around), then re-enables the transition.
  const jump = useCallback((to: number, then?: number) => {
    setAnimate(false);
    setIndex(to);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        if (then !== undefined) setIndex(then);
      }),
    );
  }, []);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, n)), [n]);
  const prev = () => (index === 0 ? jump(n, n - 1) : setIndex(index - 1));

  useEffect(() => {
    if (paused || n <= 1 || !step || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(next, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, next, n, step]);

  // After sliding onto the clones, snap back to the real first card invisibly.
  const onTransitionEnd = (e: React.TransitionEvent) => {
    // Ignore transitions bubbling up from inside the cards.
    if (e.target === e.currentTarget && index >= n) jump(0);
  };

  const current = index % n;
  const arrow =
    "grid size-10 place-items-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground";

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div ref={viewport} className="overflow-hidden">
        <ul
          onTransitionEnd={onTransitionEnd}
          className={cn("flex gap-4", animate && "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]")}
          style={{ transform: `translateX(${-index * step}px)` }}
        >
          {[...items, ...items.slice(0, MAX_VISIBLE)].map((item, i) => (
            <li
              key={i}
              data-card
              aria-hidden={i >= n || undefined}
              className="shrink-0 basis-full sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)] xl:basis-[calc((100%-3rem)/4)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {n > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button type="button" onClick={prev} aria-label={dict.home.testimonialsPrev} className={arrow}>
            <ChevronLeftIcon className="size-4" />
          </button>
          <div className="flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1} / ${n}`}
                aria-current={i === current || undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === current ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40",
                )}
              />
            ))}
          </div>
          <button type="button" onClick={next} aria-label={dict.home.testimonialsNext} className={arrow}>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
