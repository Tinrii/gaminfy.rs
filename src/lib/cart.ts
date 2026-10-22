import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { AVAILABLE_CODES_SQL, productGroupName } from "@/lib/catalog";
import { validateCoupon, type CouponError } from "@/lib/coupons";
import { db, schema } from "@/lib/db";

const { products, categories } = schema;

/** Most units of one product in a single order. */
export const MAX_QUANTITY = 10;

export type CartInputItem = { productId: number; quantity: number };

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  /** Untranslated name, stored on the order as a snapshot. */
  nameSr: string;
  categoryName: string;
  imageUrl: string | null;
  deliveryType: "automatic" | "manual";
  unitPriceMinor: number;
  /** Same item in the official in-game store, if the admin set it. */
  officialPriceMinor: number | null;
  currency: string;
  quantity: number;
  /** Highest quantity that can be ordered right now (0 = sold out). */
  maxQuantity: number;
  lineTotalMinor: number;
};

export type CartQuote = {
  lines: CartLine[];
  /** Products in the cart that no longer exist or are hidden. */
  removedIds: number[];
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  totalMinor: number;
  /** How much less than the official store prices the cart costs (lines with an official price only, before coupons). */
  savingsMinor: number;
  coupon: { id: number; code: string; type: "fixed" | "percent"; value: number } | null;
  couponError: CouponError | null;
  couponMinSubtotalMinor: number | null;
};

/** Merges duplicate lines and drops anything malformed. */
export function normalizeItems(items: unknown): CartInputItem[] {
  if (!Array.isArray(items)) return [];
  const merged = new Map<number, number>();
  for (const raw of items.slice(0, 50)) {
    const productId = Number((raw as CartInputItem)?.productId);
    const quantity = Math.floor(Number((raw as CartInputItem)?.quantity));
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) continue;
    merged.set(productId, Math.min((merged.get(productId) ?? 0) + quantity, MAX_QUANTITY));
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Prices a cart from live data: current prices, names in the visitor's language,
 * stock limits and an optional coupon. Used for the cart drawer and again at checkout.
 */
export async function quoteCart(rawItems: unknown, locale: Locale, couponCode?: string | null): Promise<CartQuote> {
  const items = normalizeItems(rawItems);
  const ids = items.map((i) => i.productId);

  const rows = ids.length
    ? await db()
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          nameEn: products.nameEn,
          imageUrl: sql<string | null>`coalesce(${products.imageUrl}, ${categories.thumbUrl}, ${categories.imageUrl})`,
          categoryName: productGroupName(locale),
          deliveryType: products.deliveryType,
          priceMinor: products.priceMinor,
          officialPriceMinor: products.officialPriceMinor,
          currency: products.currency,
          manualStock: products.manualStock,
          codes: sql<number>`${AVAILABLE_CODES_SQL}`,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(and(inArray(products.id, ids), eq(products.isActive, true), eq(categories.isActive, true)))
    : [];

  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: CartLine[] = [];
  const removedIds: number[] = [];

  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) {
      removedIds.push(item.productId);
      continue;
    }
    const stock = p.deliveryType === "automatic" ? Number(p.codes) : p.manualStock;
    const maxQuantity = stock === null ? MAX_QUANTITY : Math.max(0, Math.min(stock, MAX_QUANTITY));
    const quantity = maxQuantity === 0 ? item.quantity : Math.min(item.quantity, maxQuantity);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: locale === "en" ? (p.nameEn ?? p.name) : p.name,
      nameSr: p.name,
      categoryName: p.categoryName,
      imageUrl: p.imageUrl,
      deliveryType: p.deliveryType,
      unitPriceMinor: p.priceMinor,
      officialPriceMinor: p.officialPriceMinor,
      currency: p.currency,
      quantity,
      maxQuantity,
      lineTotalMinor: maxQuantity === 0 ? 0 : p.priceMinor * quantity,
    });
  }

  const subtotalMinor = lines.reduce((sum, l) => sum + l.lineTotalMinor, 0);
  const savingsMinor = lines.reduce(
    (sum, l) =>
      l.maxQuantity > 0 && l.officialPriceMinor && l.officialPriceMinor > l.unitPriceMinor
        ? sum + (l.officialPriceMinor - l.unitPriceMinor) * l.quantity
        : sum,
    0,
  );
  let coupon: CartQuote["coupon"] = null;
  let couponError: CouponError | null = null;
  let couponMinSubtotalMinor: number | null = null;
  let discountMinor = 0;

  if (couponCode?.trim()) {
    const result = await validateCoupon(couponCode, subtotalMinor);
    if ("error" in result) {
      couponError = result.error;
      couponMinSubtotalMinor = result.minSubtotalMinor ?? null;
    } else {
      coupon = { id: result.coupon.id, code: result.coupon.code, type: result.coupon.type, value: result.coupon.value };
      discountMinor = result.discountMinor;
    }
  }

  return {
    lines,
    removedIds,
    currency: lines[0]?.currency ?? "RSD",
    subtotalMinor,
    discountMinor,
    totalMinor: subtotalMinor - discountMinor,
    savingsMinor,
    coupon,
    couponError,
    couponMinSubtotalMinor,
  };
}
