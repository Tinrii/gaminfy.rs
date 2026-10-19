"use client";

import Link from "next/link";
import { CheckIcon, LayoutGridIcon } from "lucide-react";
import { ProductImage } from "@/components/shop/product-image";
import { useI18n } from "@/i18n/client";
import { plural, t } from "@/i18n/dictionaries";
import type { CategoryWithCount, SubcategoryWithCount } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** "Fortnite random nalozi" inside the Fortnite panel reads as "Random nalozi". */
function shortName(name: string, categoryName: string) {
  const rest = name.toLowerCase().startsWith(categoryName.toLowerCase() + " ") ? name.slice(categoryName.length + 1) : name;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** Highlighted panel of large tiles, shown only for games that have subcategories (e.g. Fortnite). */
export function SubcategorySwitcher({
  category,
  subcategories,
  active,
}: {
  category: CategoryWithCount;
  subcategories: SubcategoryWithCount[];
  active?: string;
}) {
  const { locale, dict, href } = useI18n();
  const m = dict.marketplace;
  const base = `/marketplace?category=${encodeURIComponent(category.slug)}`;

  const tile = (on: boolean) =>
    cn(
      "group relative flex h-full flex-col justify-between gap-3 rounded-xl border px-4 py-3 transition-colors",
      on
        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
        : "border-white/10 bg-background/50 hover:border-primary/50 hover:bg-primary/[0.06]",
    );
  const count = (on: boolean) => cn("text-xs tabular-nums", on ? "text-primary-foreground/75" : "text-muted-foreground");

  const tiles = [
    { key: "all", name: m.allInCategory, offers: category.offers, to: base, on: !active },
    ...subcategories.map((s) => ({
      key: s.slug,
      name: shortName(s.name, category.name),
      offers: s.offers,
      to: `${base}&sub=${encodeURIComponent(s.slug)}`,
      on: active === s.slug,
    })),
  ];

  return (
    <nav
      aria-label={m.subcategoriesLabel}
      className="relative mt-5 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.09] via-card/60 to-card/40 p-3 sm:p-4"
    >
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative mb-3 flex items-center gap-3">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
          <ProductImage src={category.thumbUrl ?? category.imageUrl} alt="" fill sizes="40px" className="object-cover" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{t(m.subcategoriesTitle, { category: category.name })}</p>
          <p className="text-xs text-muted-foreground">{m.subcategoriesHint}</p>
        </div>
      </div>

      <ul className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 lg:auto-cols-fr lg:grid-flow-col">
        {tiles.map((x) => (
          <li key={x.key}>
            <Link href={href(x.to)} scroll={false} aria-current={x.on ? "page" : undefined} className={tile(x.on)}>
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm leading-snug font-semibold">{x.name}</span>
                {x.on ? (
                  <CheckIcon className="size-4 shrink-0" />
                ) : (
                  x.key === "all" && <LayoutGridIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
              </span>
              <span className={count(x.on)}>{plural(locale, x.offers, dict.category.offers)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
