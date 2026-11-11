import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { cartKey } from "@/lib/cart-key";
import { PLAIN_CODES_SQL, VARIANT_CODES_SQL, productGroupName } from "@/lib/catalog";
import { validateCoupon, type CouponError } from "@/lib/coupons";
import { db, schema } from "@/lib/db";

const { products, productVariants, categories } = schema;

/** Most units of one product in a single order. */
export const MAX_QUANTITY = 10;

export type CartInputItem = { productId: number; variantId: number | null; quantity: number };

export type CartLine = {
  /** cartKey(productId, variantId) — how the client cart identifies this line. */
  key: string;
  productId: number;
  variantId: number | null;
  slug: string;
  name: string;
  /** Untranslated name, stored on the order as a snapshot. */
  nameSr: string;
  /** Chosen option (products with options only), translated and as the Serbian snapshot. */
  variantName: string | null;
  variantNameSr: string | null;
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
  /** Cart keys of products or options that no longer exist or are hidden. */
  removedKeys: string[];
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
  const merged = new Map<string, CartInputItem>();
  for (const raw of items.slice(0, 50)) {
    const productId = Number((raw as CartInputItem)?.productId);
    const rawVariant = (raw as CartInputItem)?.variantId;
    const variantId = rawVariant == null ? null : Number(rawVariant);
    const quantity = Math.floor(Number((raw as CartInputItem)?.quantity));
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) continue;
    if (variantId !== null && (!Number.isInteger(variantId) || variantId <= 0)) continue;
    const key = cartKey(productId, variantId);
    const prev = merged.get(key)?.quantity ?? 0;
    merged.set(key, { productId, variantId, quantity: Math.min(prev + quantity, MAX_QUANTITY) });
  }
  return [...merged.values()];
}

/**
 * Prices a cart from live data: current prices, names in the visitor's language,
 * stock limits and an optional coupon. Used for the cart drawer and again at checkout.
 */
export async function quoteCart(rawItems: unknown, locale: Locale, couponCode?: string | null): Promise<CartQuote> {
  const items = normalizeItems(rawItems);
  const ids = [...new Set(items.map((i) => i.productId))];

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
          codes: sql<number>`${PLAIN_CODES_SQL}`,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(and(inArray(products.id, ids), eq(products.isActive, true), eq(categories.isActive, true)))
    : [];

  // Active options of those products — a product with any must be bought through one.
  const variantRows = rows.length
    ? await db()
        .select({
          id: productVariants.id,
          productId: productVariants.productId,
          name: productVariants.name,
          nameEn: productVariants.nameEn,
          priceMinor: productVariants.priceMinor,
          officialPriceMinor: productVariants.officialPriceMinor,
          manualStock: productVariants.manualStock,
          codes: sql<number>`${VARIANT_CODES_SQL}`,
        })
        .from(productVariants)
        .where(and(inArray(productVariants.productId, rows.map((r) => r.id)), eq(productVariants.isActive, true)))
    : [];

  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: CartLine[] = [];
  const removedKeys: string[] = [];

  for (const item of items) {
    const key = cartKey(item.productId, item.variantId);
    const p = byId.get(item.productId);
    const options = variantRows.filter((v) => v.productId === item.productId);
    const v = item.variantId === null ? undefined : options.find((o) => o.id === item.variantId);
    // Gone, hidden, or the option no longer matches how the product is sold.
    if (!p || (options.length > 0 ? !v : item.variantId !== null)) {
      removedKeys.push(key);
      continue;
    }
    const source = v ?? p;
    const stock = p.deliveryType === "automatic" ? Number(source.codes) : source.manualStock;
    const maxQuantity = stock === null ? MAX_QUANTITY : Math.max(0, Math.min(stock, MAX_QUANTITY));
    const quantity = maxQuantity === 0 ? item.quantity : Math.min(item.quantity, maxQuantity);
    lines.push({
      key,
      productId: p.id,
      variantId: v?.id ?? null,
      slug: p.slug,
      name: locale === "en" ? (p.nameEn ?? p.name) : p.name,
      nameSr: p.name,
      variantName: v ? (locale === "en" ? (v.nameEn ?? v.name) : v.name) : null,
      variantNameSr: v?.name ?? null,
      categoryName: p.categoryName,
      imageUrl: p.imageUrl,
      deliveryType: p.deliveryType,
      unitPriceMinor: source.priceMinor,
      officialPriceMinor: source.officialPriceMinor,
      currency: p.currency,
      quantity,
      maxQuantity,
      lineTotalMinor: maxQuantity === 0 ? 0 : source.priceMinor * quantity,
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
    removedKeys,

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
