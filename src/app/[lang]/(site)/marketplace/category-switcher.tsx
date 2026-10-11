"use client";

import Link from "next/link";
import { LayoutGridIcon } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { useI18n } from "@/i18n/client";
import type { CategoryWithCount } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function CategorySwitcher({ categories, active }: { categories: CategoryWithCount[]; active?: string }) {
  const { dict, href } = useI18n();
  const tile =
    "flex h-14 shrink-0 snap-start items-center gap-3 rounded-xl border px-3 pr-4 text-sm font-semibold whitespace-nowrap transition-colors";
  const state = (on: boolean) =>
    on
      ? "border-primary/70 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px] shadow-primary/30"
      : "border-white/[0.06] bg-card text-muted-foreground hover:border-white/15 hover:text-foreground";

  return (
    <nav aria-label={dict.marketplace.gamesLabel} className="-mx-4 sm:-mx-6">
      <ul className="scrollbar-none flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-3rem),transparent)] sm:scroll-px-6 sm:px-6">
        <li>
          <Link href={href("/marketplace")} scroll={false} aria-current={!active ? "page" : undefined} className={cn(tile, state(!active))}>
            <span className="grid size-8 place-items-center rounded-lg bg-secondary">
              <LayoutGridIcon className="size-4" />
            </span>
            {dict.marketplace.allGames}
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={href(`/marketplace?category=${c.slug}`)}
              scroll={false}
              aria-current={active === c.slug ? "page" : undefined}
              className={cn(tile, state(active === c.slug))}
            >
              <span className="relative size-8 overflow-hidden rounded-lg">
                <ProductImage src={c.thumbUrl ?? c.imageUrl} alt="" fill sizes="32px" className="object-cover" />
              </span>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
