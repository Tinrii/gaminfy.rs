"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, LayoutGridIcon } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { useI18n } from "@/i18n/client";
import type { CategoryWithCount } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function CategorySwitcher({ categories, active }: { categories: CategoryWithCount[]; active?: string }) {
  const { dict, href } = useI18n();
  const listRef = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    updateEdges();

    // A mouse wheel only scrolls vertically; turn it into sideways movement while the
    // row can still move, then let the page scroll normally once an end is reached.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY });
    };

    const resize = new ResizeObserver(updateEdges);
    resize.observe(el);
    el.addEventListener("scroll", updateEdges, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      resize.disconnect();
      el.removeEventListener("scroll", updateEdges);
      el.removeEventListener("wheel", onWheel);
    };
  }, [updateEdges]);

  // Bring the selected game into view (only moves the row, never the page).
  useEffect(() => {
    const el = listRef.current;
    const current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !current) return;
    const offset = current.offsetLeft - el.clientWidth / 2 + current.offsetWidth / 2;
    el.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, [active]);

  const page = (direction: -1 | 1) => {
    const el = listRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: "smooth" });
  };

  const overflowing = canLeft || canRight;

  // Soft edge fade only on the side(s) that still hide games.
  const mask = canLeft && canRight
    ? "[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]"
    : canLeft
      ? "[mask-image:linear-gradient(to_right,transparent,black_3rem)]"
      : canRight
        ? "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]"
        : "";

  const chip = (on: boolean) =>
    cn(
      "group flex h-11 w-full shrink-0 snap-start items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 text-sm whitespace-nowrap transition-colors",
      on
        ? "bg-primary font-semibold text-primary-foreground"
        : "bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground",
    );
  const thumb = (on: boolean) =>
    cn("relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full", on ? "ring-2 ring-primary-foreground/25" : "bg-white/[0.06]");
  const arrow =
    "grid size-8 place-items-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

  return (
    <nav aria-label={dict.marketplace.gamesLabel}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {dict.marketplace.gamesLabel}
          <span className="ml-2 text-muted-foreground/60 tabular-nums">{categories.length}</span>
        </p>
        {overflowing && (
          <div className="hidden gap-1.5 sm:flex">
            <button type="button" onClick={() => page(-1)} disabled={!canLeft} aria-label={dict.marketplace.scrollLeft} className={arrow}>
              <ChevronLeftIcon className="size-4" />
            </button>
            <button type="button" onClick={() => page(1)} disabled={!canRight} aria-label={dict.marketplace.scrollRight} className={arrow}>
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div className="-mx-4 sm:mx-0">
        {/* Two rows that flow sideways; past the container width it scrolls (arrows above). */}
        <ul
          ref={listRef}
          className={cn(
            "scrollbar-none grid auto-cols-max grid-flow-col grid-rows-2 snap-x gap-2 overflow-x-auto overscroll-x-contain px-4 sm:px-0",
            mask,
          )}
        >
          <li>
            <Link href={href("/marketplace")} scroll={false} aria-current={!active ? "page" : undefined} className={chip(!active)}>
              <span className={thumb(!active)}>
                <LayoutGridIcon className="size-4" />
              </span>
              {dict.marketplace.allGames}
            </Link>
          </li>
          {categories.map((c) => {
            const on = active === c.slug;
            return (
              <li key={c.id}>
                <Link
                  href={href(`/marketplace?category=${c.slug}`)}
                  scroll={false}
                  aria-current={on ? "page" : undefined}
                  className={chip(on)}
                >
                  <span className={thumb(on)}>
                    <ProductImage src={c.thumbUrl ?? c.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                  </span>
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
