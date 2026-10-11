"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { AVAILABLE_CODES_SQL } from "@/lib/catalog";
import { db, schema } from "@/lib/db";
import { paymentsEnabled, stripe } from "@/lib/stripe";
import { syncCurrentUser } from "@/lib/users";

const { products, orders } = schema;

/** Errors are dictionary keys so the client renders them in the visitor's language. */
export type CheckoutState = { error?: keyof Dictionary["checkout"] };

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const productId = Number(formData.get("productId"));
  const rawLocale = String(formData.get("locale") ?? "");
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "sr";
  const path = (p: string) => localePath(locale, p);
  if (!Number.isInteger(productId) || productId <= 0) return { error: "unknown" };

  // Fresh (uncached) read: price and stock must be current at checkout time.
  const [product] = await db()
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      nameEn: products.nameEn,
      priceMinor: products.priceMinor,
      currency: products.currency,
      deliveryType: products.deliveryType,
      manualStock: products.manualStock,
      imageUrl: products.imageUrl,
      isActive: products.isActive,
      codes: sql<number>`${AVAILABLE_CODES_SQL}`,
    })
    .from(products)
    .where(eq(products.id, productId));

  if (!product || !product.isActive) return { error: "unavailable" };

  const { userId } = await auth();
  if (!userId) redirect(`${path("/sign-in")}?redirect_url=${encodeURIComponent(path(`/product/${product.slug}`))}`);

  const inStock =
    product.deliveryType === "automatic"
      ? Number(product.codes) > 0
      : product.manualStock === null || product.manualStock > 0;
  if (!inStock) return { error: "outOfStock" };

  if (!paymentsEnabled()) {
    return { error: "notLive" };
  }

  const user = await syncCurrentUser();
  if (!user) redirect(path("/sign-in"));

  // Reuse an unpaid order for the same product instead of piling up pending rows.
  const [existing] = await db()
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.userId, user.id),
        eq(orders.productId, product.id),
        eq(orders.status, "pending"),
        isNull(orders.paidAt),
      ),
    )
    .limit(1);

  let orderId = existing?.id;
  if (!orderId) {
    const [res] = await db().insert(orders).values({
      userId: user.id,
      productId: product.id,
      amountMinor: product.priceMinor,
      currency: product.currency,
      locale,
    });
    orderId = res.insertId;
  } else {
    await db()
      .update(orders)
      .set({ amountMinor: product.priceMinor, currency: product.currency, locale })
      .where(eq(orders.id, orderId));
  }

  let url: string | null;
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency.toLowerCase(),
            unit_amount: product.priceMinor,
            product_data: { name: locale === "en" ? (product.nameEn ?? product.name) : product.name },
          },
        },
      ],
      customer_email: user.email || undefined,
      client_reference_id: String(orderId),
      metadata: { orderId: String(orderId), productId: String(product.id) },
      success_url: `${SITE()}${path(`/orders/${orderId}`)}?checkout=success`,
      cancel_url: `${SITE()}${path(`/product/${product.slug}`)}?checkout=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    await db().update(orders).set({ stripeCheckoutSessionId: session.id }).where(eq(orders.id, orderId));
    url = session.url;
  } catch (err) {
    console.error("[checkout] Stripe session failed", err);
    return { error: "failed" };
  }

  if (!url) return { error: "failed" };
  redirect(url);
}
