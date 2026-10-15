"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export type HeroCategory = { slug: string; name: string; imageUrl: string | null };

/** Where a card sits in the fan, by its distance from the front card. */
const SLOTS: Record<"front" | "left" | "right" | "hidden", React.CSSProperties> = {
  front: { left: "28%", top: "0%", transform: "rotate(0deg) scale(1)", opacity: 1, zIndex: 30 },
  left: { left: "4%", top: "14%", transform: "rotate(-11deg) scale(0.92)", opacity: 1, zIndex: 20 },
  right: { left: "52%", top: "10%", transform: "rotate(9deg) scale(0.92)", opacity: 1, zIndex: 20 },
  hidden: { left: "28%", top: "12%", transform: "rotate(0deg) scale(0.8)", opacity: 0, zIndex: 10 },
};

/** Signed shortest distance from the front card on a circular list. */
function offset(i: number, index: number, n: number) {
  let d = (i - index) % n;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

export function HeroCarousel({ categories }: { categories: HeroCategory[] }) {
  const { dict, href } = useI18n();
  const n = categories.length;
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const lastWheel = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const go = useCallback((step: number) => setIndex((i) => (i + step + n) % n), [n]);

  // Scrolling over the cards (mouse wheel either way, or a trackpad swipe) flips them.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 4) return;
      e.preventDefault();
      // One card per gesture: a wheel notch or trackpad swipe fires many events.
      const now = Date.now();
      if (now - lastWheel.current < 450) return;
      lastWheel.current = now;
      go(delta > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [go]);

  if (n === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={dict.hero.carouselLabel}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      className="mx-auto w-full max-w-[34rem]"
    >
      <div
        ref={stageRef}
        className="relative aspect-[1.15] touch-pan-y select-none"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true;
        }}
        onPointerUp={(e) => {
          const start = drag.current;
          if (start && Math.abs(e.clientX - start.x) > 40) go(e.clientX < start.x ? 1 : -1);
        }}
        // A drag shouldn't also count as a click on the card under the pointer.
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
          drag.current = null;
        }}
      >
        <div aria-hidden className="absolute inset-[12%] rounded-full bg-primary/20 blur-[90px]" />
        {categories.map((c, i) => {
          const d = offset(i, index, n);
          const slot = d === 0 ? "front" : d === -1 ? "left" : d === 1 ? "right" : "hidden";
          const card = (
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] border border-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
              <ProductImage
                src={c.imageUrl}
                alt={c.name}
                fill
                priority={Math.abs(d) <= 1}
                draggable={false}
                sizes="(min-width: 1024px) 240px, 40vw"
                className="object-cover"
              />
              {slot === "front" && (
                <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm font-semibold backdrop-blur-md">
                  <span className="truncate">{c.name}</span>
                  <ArrowRightIcon className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </div>
          );
          return (
            <div
              key={c.slug}
              style={SLOTS[slot]}
              className={cn(
                "absolute w-[44%] transition-[left,top,transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                slot === "hidden" && "pointer-events-none",
              )}
              aria-hidden={slot === "hidden" || undefined}
            >
              {slot === "front" ? (
                <Link
                  href={href(`/marketplace?category=${c.slug}`)}
                  aria-label={`${c.name} — ${dict.category.viewOffers}`}
                  draggable={false}
                  className="group block rounded-[1.4rem] transition-transform duration-300 hover:-translate-y-1.5"
                >
                  {card}
                </Link>
              ) : (
                <button
                  type="button"
                  tabIndex={slot === "hidden" ? -1 : 0}
                  onClick={() => go(d)}
                  aria-label={t(dict.hero.goTo, { name: c.name })}
                  className="block w-full cursor-pointer rounded-[1.4rem] text-left brightness-75 transition-[filter] hover:brightness-100"
                >
                  {card}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
