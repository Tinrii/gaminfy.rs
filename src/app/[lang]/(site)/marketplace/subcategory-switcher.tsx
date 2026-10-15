"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import type { SubcategoryWithCount } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Second row of tabs, shown only for games that have subcategories (e.g. Fortnite). */
export function SubcategorySwitcher({
  category,
  subcategories,
  active,
}: {
  category: string;
  subcategories: SubcategoryWithCount[];
  active?: string;
}) {
  const { dict, href } = useI18n();
  const base = `/marketplace?category=${encodeURIComponent(category)}`;

  const chip = (on: boolean) =>
    cn(
      "flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
      on
        ? "border-primary/60 bg-primary/10 font-semibold text-foreground"
        : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
    );

  return (
    <nav aria-label={dict.marketplace.subcategoriesLabel} className="mt-4 -mx-4 sm:mx-0">
      <ul className="scrollbar-none flex gap-2 overflow-x-auto px-4 sm:flex-wrap sm:px-0">
        <li>
          <Link href={href(base)} scroll={false} aria-current={!active ? "page" : undefined} className={chip(!active)}>
            {dict.marketplace.allInCategory}
          </Link>
        </li>
        {subcategories.map((s) => {
          const on = active === s.slug;
          return (
            <li key={s.id}>
              <Link
                href={href(`${base}&sub=${encodeURIComponent(s.slug)}`)}
                scroll={false}
                aria-current={on ? "page" : undefined}
                className={chip(on)}
              >
                {s.name}
                <span className="text-xs text-muted-foreground tabular-nums">{s.offers}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
