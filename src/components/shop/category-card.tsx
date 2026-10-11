"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/dictionaries";
import type { CategoryWithCount } from "@/lib/catalog";
import { ProductImage } from "./product-image";

export function CategoryCard({ category }: { category: CategoryWithCount }) {
  const { locale, dict, href } = useI18n();
  return (
    <Link href={href(`/marketplace?category=${category.slug}`)} data-reveal className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
        <ProductImage
          src={category.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/75 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="grid size-12 translate-y-2 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-300 group-hover:translate-y-0">
            <ArrowRightIcon className="size-5" />
          </span>
          <span className="text-sm font-semibold">{dict.category.viewOffers}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold">{category.name}</p>
      <p className="text-xs text-muted-foreground">{plural(locale, category.offers, dict.category.offers)}</p>
    </Link>
  );
}
