import type { Metadata } from "next";
import { plural, t } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearchIcon, ShoppingCartIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/shop/product-card";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getProducts, PAGE_SIZE, type ProductQuery, type ProductSort } from "@/lib/catalog";
import { CategorySwitcher } from "./category-switcher";
import { MarketplaceFilters } from "./filters";

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
  const query: ProductQuery = {
    locale,
    category: one(sp.category) || undefined,
    q: one(sp.q)?.trim().slice(0, 80) || undefined,
    min: num(one(sp.min)),
    max: num(one(sp.max)),
    sort: sort && SORTS.includes(sort) ? sort : "featured",
    inStock: one(sp.stock) === "1",
  };
  const limit = Math.min(Math.max(num(one(sp.show)) ?? PAGE_SIZE, PAGE_SIZE), 200);

  const [categories, { items, total }] = await Promise.all([getCategories(locale), getProducts({ ...query, limit })]);
  const active = categories.find((c) => c.slug === query.category);

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...query, locale: undefined, inStock: undefined, stock: query.inStock ? "1" : undefined })) {
    if (v !== undefined && v !== "" && !(k === "sort" && v === "featured")) params.set(k, String(v));
  }
  params.set("show", String(limit + PAGE_SIZE));

  return (
    <section className="container-page pb-28">
      <CategorySwitcher categories={categories} active={query.category} />

      <MarketplaceFilters
        key={`filters-${JSON.stringify(query)}`}
        category={query.category}
        q={query.q}
        min={query.min}
        max={query.max}
        sort={query.sort}
        inStock={query.inStock}
      />

      <div className="mt-8 mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">
          {active ? active.name : query.q ? t(dict.marketplace.resultsFor, { q: query.q }) : dict.marketplace.allProducts}
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
