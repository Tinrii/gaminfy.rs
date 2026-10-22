"use client";

import { useState } from "react";
import { CrosshairIcon, SendIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import type { ProductCard as ProductCardData, SubcategoryWithCount } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Weekly CS2 offers with skin-type filters (the CS2 category's subcategories), filtered in place. */
export function Cs2Offers({ items, groups }: { items: ProductCardData[]; groups: SubcategoryWithCount[] }) {
  const { dict } = useI18n();
  const c = dict.cs2;
  const [group, setGroup] = useState<string | null>(null);
  const shown = group ? items.filter((p) => p.subcategorySlug === group) : items;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-primary/30 bg-card/60 px-6 py-16 text-center backdrop-blur">
        <CrosshairIcon className="size-10 text-primary" />
        <p className="mt-4 text-lg font-semibold">{c.emptyTitle}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{c.emptyText}</p>
        <Button asChild className="mt-6 h-11 rounded-xl px-6 font-semibold">
          <a href="#kupovina">
            <SendIcon /> {c.askCta}
          </a>
        </Button>
      </div>
    );
  }

  const chips = [{ slug: null, name: c.all, offers: items.length }, ...groups.map((g) => ({ slug: g.slug, name: g.name, offers: g.offers }))];

  return (
    <>
      <div role="group" aria-label={c.filtersLabel} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((chip) => {
          const on = group === chip.slug;
          return (
            <button
              key={chip.slug ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => setGroup(chip.slug)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/10 bg-card/70 text-foreground/90 backdrop-blur hover:border-primary/50",
              )}
            >
              {chip.name}
              <span className={cn("text-xs tabular-nums", on ? "text-primary-foreground/70" : "text-muted-foreground")}>{chip.offers}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-card/60 px-5 py-10 text-center text-sm text-muted-foreground backdrop-blur">
          {c.emptyFilter}
        </p>
      ) : (
        <Reveal key={group ?? "all"} stagger={0.04}>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} skin officialPriceLabel={c.marketPrice} />
            ))}
          </div>
        </Reveal>
      )}
    </>
  );
}
