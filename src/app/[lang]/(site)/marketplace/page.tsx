import type { Metadata } from "next";
import { plural, t } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PackageSearchIcon, ShoppingCartIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CheckoutNotice } from "@/components/shop/checkout-notice";
import { ProductCard } from "@/components/shop/product-card";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategories,
  getProducts,
  getSearchTargets,
  getSubcategories,
  PAGE_SIZE,
  type ProductQuery,
  type ProductSort,
} from "@/lib/catalog";
import { CS2_CATEGORY } from "@/lib/site";
import { CategorySwitcher } from "./category-switcher";
import { MarketplaceFilters } from "./filters";
import { SubcategorySwitcher } from "./subcategory-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return pageMetadata({ title: dict.marketplace.title, description: dict.marketplace.metaDescription, path: "/marketplace" });
}

const SORTS: ProductSort[] = ["featured", "price-asc", "price-desc", "name"];

export default async function MarketplacePage({ searchParams }: PageProps<"/[lang]/marketplace">) {
  const { dict } = await getI18n();
  return (
    <>
      <PageHero icon={ShoppingCartIcon} title={dict.marketplace.title}>
        {dict.marketplace.description}
      </PageHero>
      <Suspense>
        <div className="container-page">
          <CheckoutNotice />
        </div>
      </Suspense>
      <Suspense fallback={<MarketplaceSkeleton />}>
        <Marketplace searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

async function Marketplace({ searchParams }: Pick<PageProps<"/[lang]/marketplace">, "searchParams">) {
  const { locale, dict, href } = await getI18n();
  const sp = await searchParams;
  const sort = one(sp.sort) as ProductSort | undefined;
  const category = one(sp.category) || undefined;
  const [categories, searchTargets, subcategories] = await Promise.all([
    getCategories(locale),
    getSearchTargets(locale),
    category ? getSubcategories(category, locale) : [],
  ]);
  // CS2 skins live on their own page.
  if (category === CS2_CATEGORY) redirect(href("/cs2"));
  // Old links to games that are now a subcategory (e.g. ?category=brawl-stars → Mobile Games).
  if (category && !categories.some((c) => c.slug === category)) {
    const moved = searchTargets.find((x) => x.sub === category);
    if (moved) redirect(href(`/marketplace?category=${moved.slug}&sub=${moved.sub}`));
  }
  const query: ProductQuery = {
    locale,
    category,
    // Unknown subcategory slugs are ignored rather than showing an empty page.
    sub: subcategories.find((s) => s.slug === one(sp.sub))?.slug,
    q: one(sp.q)?.trim().slice(0, 80) || undefined,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    inStock: one(sp.stock) === "1",
  };
  const limit = Math.min(Math.max(num(one(sp.show)) ?? PAGE_SIZE, PAGE_SIZE), 200);

  const { items, total } = await getProducts({ ...query, limit });
  const active = categories.find((c) => c.slug === query.category);
  const activeSub = subcategories.find((s) => s.slug === query.sub);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...query, locale: undefined, inStock: undefined, stock: query.inStock ? "1" : undefined })) {
    if (v !== undefined && v !== "" && !(k === "sort" && v === "featured")) params.set(k, String(v));
  }
  params.set("show", String(limit + PAGE_SIZE));

  return (
    <section className="container-page pb-28">
      <CategorySwitcher categories={categories} active={query.category} />
      {active && subcategories.length > 0 && (
        <SubcategorySwitcher category={active} subcategories={subcategories} active={query.sub} />
      )}

      <MarketplaceFilters
        key={`filters-${JSON.stringify(query)}`}
        categories={searchTargets}
        category={query.category}
        sub={query.sub}
        q={query.q}
        min={query.min}
        max={query.max}
        sort={query.sort}
        inStock={query.inStock}
      />

      <div className="mt-8 mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {activeSub ? activeSub.name : active ? active.name : query.q ? t(dict.marketplace.resultsFor, { q: query.q }) : dict.marketplace.allProducts}
        </h2>
        <p className="text-xs text-muted-foreground">
          {plural(locale, total, dict.marketplace.productCount)}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 px-6 py-20 text-center">
          <PackageSearchIcon className="size-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">{dict.marketplace.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{dict.marketplace.emptyText}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={href("/marketplace")}>{dict.marketplace.clearFilters}</Link>
          </Button>
        </div>
      ) : (
        <Reveal key={`grid-${JSON.stringify(query)}`} stagger={0.04}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 5} />
            ))}
          </div>
        </Reveal>
      )}

      {items.length < total && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-8">
            <Link href={href(`/marketplace?${params}`)} scroll={false}>
              {dict.marketplace.showMore}
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            {t(dict.marketplace.showing, { shown: items.length, total })}
          </p>
        </div>
      )}
    </section>
  );
}

function MarketplaceSkeleton() {
  return (
    <section className="container-page pb-28">
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-36 shrink-0 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
