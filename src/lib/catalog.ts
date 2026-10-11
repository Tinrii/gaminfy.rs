import "server-only";
import { and, asc, desc, eq, gte, like, lte, or, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { Locale } from "@/i18n/config";
import { db, schema } from "@/lib/db";

const { categories, products, orders } = schema;

export const CATALOG_TAG = "catalog";
export const PAGE_SIZE = 10;

/**
 * Unassigned codes for this product (correlated subquery). Written as raw, fully
 * qualified SQL because drizzle drops table prefixes in single-table selects.
 */
export const AVAILABLE_CODES_SQL = sql.raw(
  "(select count(*) from `product_codes` pc where pc.`product_id` = `products`.`id` and pc.`order_id` is null)",
);
const availableCodes = sql<number>`${AVAILABLE_CODES_SQL}`;

const inStockExpr = sql<boolean>`(
  (${products.deliveryType} = 'automatic' and ${availableCodes} > 0)
  or (${products.deliveryType} = 'manual' and (${products.manualStock} is null or ${products.manualStock} > 0))
)`;

/** English falls back to the Serbian copy when a translation is missing. */
const tr = <T>(sr: AnyColumn, en: AnyColumn, locale: Locale) =>
  locale === "en" ? sql<T>`coalesce(${en}, ${sr})` : sql<T>`${sr}`;

const productCard = (locale: Locale) => ({
  id: products.id,
  slug: products.slug,
  name: tr<string>(products.name, products.nameEn, locale),
  priceMinor: products.priceMinor,
  currency: products.currency,
  deliveryType: products.deliveryType,
  imageUrl: sql<string | null>`coalesce(${products.imageUrl}, ${categories.imageUrl})`,
  categorySlug: categories.slug,
  categoryName: categories.name,
  inStock: inStockExpr,
});

export type ProductCard = {
  id: number;
  slug: string;
  name: string;
  priceMinor: number;
  currency: string;
  deliveryType: "automatic" | "manual";
  imageUrl: string | null;
  categorySlug: string;
  categoryName: string;
  inStock: boolean;
};

const toCard = (row: Omit<ProductCard, "inStock"> & { inStock: unknown }): ProductCard => ({
  ...row,
  inStock: Boolean(Number(row.inStock)),
});

export type CategoryWithCount = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  offers: number;
};

export async function getCategories(locale: Locale): Promise<CategoryWithCount[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db()
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: tr<string | null>(categories.description, categories.descriptionEn, locale),
      imageUrl: categories.imageUrl,
      thumbUrl: categories.thumbUrl,
      offers: sql<number>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true)))
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((r) => ({ ...r, offers: Number(r.offers) }));
}

export type ProductSort = "featured" | "price-asc" | "price-desc" | "name";

export type ProductQuery = {
  locale: Locale;
  category?: string;
  q?: string;
  min?: number;
  max?: number;
  sort?: ProductSort;
  inStock?: boolean;
  limit?: number;
};

export async function getProducts(query: ProductQuery): Promise<{ items: ProductCard[]; total: number }> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const filters: SQL[] = [eq(products.isActive, true), eq(categories.isActive, true)];
  if (query.category) filters.push(eq(categories.slug, query.category));
  if (query.q) {
    const term = `%${query.q.replace(/[%_\\]/g, "\\$&")}%`;
    filters.push(or(like(products.name, term), like(products.nameEn, term), like(categories.name, term))!);
  }
  if (query.min !== undefined) filters.push(gte(products.priceMinor, query.min * 100));
  if (query.max !== undefined) filters.push(lte(products.priceMinor, query.max * 100));
  if (query.inStock) filters.push(sql`${inStockExpr}`);

  const order = {
    featured: [asc(categories.sortOrder), asc(products.sortOrder)],
    "price-asc": [asc(products.priceMinor)],
    "price-desc": [desc(products.priceMinor)],
    name: [asc(query.locale === "en" ? sql`coalesce(${products.nameEn}, ${products.name})` : products.name)],
  }[query.sort ?? "featured"];

  const where = and(...filters);
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select(productCard(query.locale))
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(...order, asc(products.id))
      .limit(query.limit ?? PAGE_SIZE),
    db()
      .select({ total: sql<number>`count(*)` })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where),
  ]);

  return { items: rows.map(toCard), total: Number(total) };
}

export type ProductDetail = ProductCard & {
  description: string | null;
  instructions: string | null;
  categoryId: number;
  requiredContactFields: string | null;
  /** Units left: codes for automatic, manual stock (null = unlimited) for manual. */
  stock: number | null;
};

export async function getProduct(slug: string, locale: Locale): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const [row] = await db()
    .select({
      ...productCard(locale),
      description: tr<string | null>(products.description, products.descriptionEn, locale),
      instructions: tr<string | null>(products.instructions, products.instructionsEn, locale),
      categoryId: products.categoryId,
      requiredContactFields: products.requiredContactFields,
      manualStock: products.manualStock,
      codes: availableCodes,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!row) return null;
  const { manualStock, codes, ...rest } = row;
  return {
    ...toCard(rest),
    description: rest.description,
    instructions: rest.instructions,
    categoryId: rest.categoryId,
    requiredContactFields: rest.requiredContactFields,
    stock: rest.deliveryType === "automatic" ? Number(codes) : manualStock,
  };
}

export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  const rows = await db()
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.isActive, true));
  return rows.map((r) => r.slug);
}

export async function getRelatedProducts(categoryId: number, excludeId: number, locale: Locale): Promise<ProductCard[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db()
    .select(productCard(locale))
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        sql`${products.id} <> ${excludeId}`,
      ),
    )
    .orderBy(asc(products.sortOrder))
    .limit(5);
  return rows.map(toCard);
}

export type SiteStats = {
  categories: number;
  products: number;
  deliveredOrders: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const [[c], [p], [o]] = await Promise.all([
    db().select({ n: sql<number>`count(*)` }).from(categories).where(eq(categories.isActive, true)),
    db().select({ n: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true)),
    db().select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "delivered")),
  ]);
  return { categories: Number(c.n), products: Number(p.n), deliveredOrders: Number(o.n) };
}

/** Everything the sitemap and llms.txt list: active categories (English copy) and products with update times. */
export async function getSitemapData() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const [cats, prods] = await Promise.all([
    db()
      .select({
        slug: categories.slug,
        name: categories.name,
        description: sql<string | null>`coalesce(${categories.descriptionEn}, ${categories.description})`,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder)),
    db()
      .select({ slug: products.slug, name: products.name, updatedAt: products.updatedAt, category: categories.slug })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.isActive, true), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder), asc(products.sortOrder)),
  ]);
  return { categories: cats, products: prods };
}
