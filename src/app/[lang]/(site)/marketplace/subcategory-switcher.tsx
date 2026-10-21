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

/** Panel of picture tiles, shown only for games that have subcategories (e.g. Fortnite). */
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
  const categoryThumb = category.thumbUrl ?? category.imageUrl;

  const tiles = [
    {
      key: "all",
      name: m.allInCategory,
      offers: category.offers,
      // No icon: "All offers" shows the game's own picture (the framed category thumbnail).
      icon: null,
      to: base,
      on: !active,
    },
    ...subcategories.map((s) => ({
      key: s.slug,
      name: shortName(s.name, category.name),
      offers: s.offers,
      icon: s.imageUrl,
      to: `${base}&sub=${encodeURIComponent(s.slug)}`,
      on: active === s.slug,
    })),
  ];

  return (
    <nav
      aria-label={m.subcategoriesLabel}
      className="relative mt-5 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/[0.07] to-card/40 p-3 sm:p-4"
    >
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-12 size-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mb-3 flex items-center gap-3 px-1 pt-1">
        <span className="relative size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
          <ProductImage src={categoryThumb} alt="" fill sizes="48px" className="object-cover" />
        </span>
        <div className="min-w-0">
          <p className="text-base leading-tight font-semibold sm:text-lg">{t(m.subcategoriesTitle, { category: category.name })}</p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{m.subcategoriesHint}</p>
        </div>
      </div>

      <ul className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:auto-cols-fr lg:grid-flow-col">
        {tiles.map((x) => (
          <li key={x.key}>
            <Link
              href={href(x.to)}
              scroll={false}
              aria-current={x.on ? "page" : undefined}
              className={cn(
                "group relative flex h-full items-center gap-3 rounded-2xl border p-2.5 pr-8 transition-colors sm:p-3 sm:pr-9",
                x.on
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "border-white/10 bg-background/40 hover:border-primary/40 hover:bg-primary/[0.05]",
              )}
            >
              <span className="relative size-11 shrink-0 sm:size-14">
                {x.icon ? (
                  // Icons are cut-outs: shown whole, with a soft shadow, no frame.
                  <ProductImage
                    src={x.icon}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <span className="absolute inset-1 overflow-hidden rounded-xl ring-1 ring-white/10">
                    <ProductImage src={categoryThumb} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-snug font-semibold sm:text-base">{x.name}</span>
                <span className={cn("block text-xs tabular-nums sm:text-sm", x.on ? "text-primary-foreground/75" : "text-muted-foreground")}>
                  {plural(locale, x.offers, dict.category.offers)}
                </span>
              </span>
              <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
                {x.on ? (
                  <CheckIcon className="size-4 sm:size-5" strokeWidth={2.5} />
                ) : (
                  x.key === "all" && <LayoutGridIcon className="size-4 text-muted-foreground" />
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
