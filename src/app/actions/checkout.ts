"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { quoteCart, type CartQuote } from "@/lib/cart";
import { db, schema } from "@/lib/db";
import { absoluteAsset } from "@/lib/seo";
import { paymentsEnabled, stripe } from "@/lib/stripe";
import { syncCurrentUser } from "@/lib/users";

const { orders, orderItems } = schema;

/** Errors are dictionary keys so the client renders them in the visitor's language. */
export type CheckoutState = { error?: keyof Dictionary["checkout"] };

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type CheckoutInput = {
  items: { productId: number; quantity: number }[];
  couponCode?: string | null;
  locale: string;
};

/** Live cart pricing for the cart drawer (public — no order is created). */
export async function getCartQuote(input: CheckoutInput): Promise<CartQuote> {
  const locale: Locale = isLocale(input.locale) ? input.locale : "sr";
  return quoteCart(input.items, locale, input.couponCode);
}

/**
 * Creates an order for the whole cart and redirects to Stripe Checkout. Prices,
 * stock and the coupon are re-checked here from live data — the client's copy of
 * the cart is never trusted.
 */
export async function startCheckout(input: CheckoutInput): Promise<CheckoutState> {
  const locale: Locale = isLocale(input.locale) ? input.locale : "sr";
  const path = (p: string) => localePath(locale, p);

  const { userId } = await auth();
  if (!userId) redirect(`${path("/sign-in")}?redirect_url=${encodeURIComponent(path("/marketplace"))}`);

  const quote = await quoteCart(input.items, locale, input.couponCode);
  if (quote.lines.length === 0) return { error: "empty" };
  if (quote.removedIds.length) return { error: "unavailable" };
  if (quote.lines.some((l) => l.maxQuantity === 0 || l.quantity > l.maxQuantity)) return { error: "outOfStock" };
  if (input.couponCode?.trim() && !quote.coupon) return { error: "coupon" };
  if (quote.totalMinor <= 0) return { error: "failed" };

  if (!paymentsEnabled()) return { error: "notLive" };

  const user = await syncCurrentUser();
  if (!user) redirect(path("/sign-in"));

  const orderId = await db().transaction(async (tx) => {
    const [res] = await tx.insert(orders).values({
      userId: user.id,
      subtotalMinor: quote.subtotalMinor,
      discountMinor: quote.discountMinor,
      amountMinor: quote.totalMinor,
      currency: quote.currency,
      couponId: quote.coupon?.id ?? null,
      couponCode: quote.coupon?.code ?? null,
      locale,
    });
    await tx.insert(orderItems).values(
      quote.lines.map((l) => ({
        orderId: res.insertId,
        productId: l.productId,
        productName: l.nameSr,
        quantity: l.quantity,
        unitPriceMinor: l.unitPriceMinor,
      })),
    );
    return res.insertId;
  });

  let url: string | null;
  try {
    // The coupon becomes a one-off Stripe discount for exactly the amount we computed.
    const discount =
      quote.discountMinor > 0
        ? await stripe().coupons.create({
            amount_off: quote.discountMinor,
            currency: quote.currency.toLowerCase(),
            duration: "once",
            max_redemptions: 1,
            name: quote.coupon?.code ?? "Gaminfy",
          })
        : null;

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: quote.lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: l.currency.toLowerCase(),
          unit_amount: l.unitPriceMinor,
          product_data: {
            name: l.name,
            ...(l.imageUrl ? { images: [absoluteAsset(l.imageUrl)] } : {}),
          },
        },
      })),
      ...(discount ? { discounts: [{ coupon: discount.id }] } : {}),
      customer_email: user.email || undefined,
      client_reference_id: String(orderId),
      metadata: { orderId: String(orderId) },
      success_url: `${SITE()}${path(`/orders/${orderId}`)}?checkout=success`,
      cancel_url: `${SITE()}${path("/marketplace")}?checkout=cancelled`,
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
