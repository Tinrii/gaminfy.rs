import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  awaitingStockEmail,
  codeDeliveredEmail,
  manualOrderPaidEmail,
  orderDeliveredEmail,
} from "@/lib/email-templates";

const { orders, products, productCodes, users, fulfillmentDetails, stripeEvents, categories } = schema;

const productName = (locale: Locale) =>
  locale === "en" ? sql<string>`coalesce(${products.nameEn}, ${products.name})` : sql<string>`${products.name}`;

type Db = ReturnType<typeof db>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type PaymentOutcome =
  | { kind: "delivered"; orderId: number; code: string }
  | { kind: "awaiting-details"; orderId: number }
  | { kind: "awaiting-stock"; orderId: number };

/**
 * Records a Stripe event and applies it exactly once. The event insert and the
 * order/stock changes share one transaction, so a crash mid-way lets Stripe's
 * retry run it again, and a duplicate delivery is a no-op.
 */
export async function applyStripeEvent<T>(
  event: { id: string; type: string },
  apply: (tx: Tx) => Promise<T>,
): Promise<{ duplicate: true } | { duplicate: false; result: T }> {
  return db().transaction(async (tx) => {
    const [res] = await tx.insert(stripeEvents).ignore().values({ id: event.id, type: event.type });
    if (res.affectedRows === 0) return { duplicate: true as const };
    return { duplicate: false as const, result: await apply(tx) };
  });
}

/**
 * Moves a pending order to paid and fulfils it where possible. The order row and
 * the chosen code are locked, so concurrent webhooks can never hand the same code
 * to two orders (product_codes.order_id is also UNIQUE as a last line of defence).
 */
export async function markOrderPaid(
  tx: Tx,
  orderId: number,
  paymentIntentId: string | null,
): Promise<PaymentOutcome | null> {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!order || order.status !== "pending") return null;

  const [product] = await tx.select().from(products).where(eq(products.id, order.productId));
  const now = new Date();

  if (product.deliveryType === "automatic") {
    const [code] = await tx
      .select({ id: productCodes.id, code: productCodes.code })
      .from(productCodes)
      .where(and(eq(productCodes.productId, product.id), isNull(productCodes.orderId)))
      .orderBy(productCodes.id)
      .limit(1)
      .for("update", { skipLocked: true });

    if (code) {
      await tx
        .update(productCodes)
        .set({ orderId: order.id, assignedAt: now })
        .where(eq(productCodes.id, code.id));
      await tx
        .update(orders)
        .set({ status: "delivered", paidAt: now, deliveredAt: now, stripePaymentIntentId: paymentIntentId })
        .where(eq(orders.id, order.id));
      return { kind: "delivered", orderId: order.id, code: code.code };
    }

    // Sold out between checkout and payment — the team restocks or refunds from the admin panel.
    await tx
      .update(orders)
      .set({ status: "paid", paidAt: now, stripePaymentIntentId: paymentIntentId })
      .where(eq(orders.id, order.id));
    return { kind: "awaiting-stock", orderId: order.id };
  }

  if (product.manualStock !== null) {
    await tx
      .update(products)
      .set({ manualStock: sql`greatest(${products.manualStock} - 1, 0)` })
      .where(eq(products.id, product.id));
  }
  await tx
    .update(orders)
    .set({ status: "paid", paidAt: now, stripePaymentIntentId: paymentIntentId })
    .where(eq(orders.id, order.id));
  return { kind: "awaiting-details", orderId: order.id };
}

export async function markOrderUnpaid(tx: Tx, orderId: number, status: "cancelled" | "failed") {
  await tx
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

async function emailContext(orderId: number) {
  const [row] = await db()
    .select({
      id: orders.id,
      amountMinor: orders.amountMinor,
      currency: orders.currency,
      locale: orders.locale,
      name: products.name,
      nameEn: products.nameEn,
      instructions: products.instructions,
      instructionsEn: products.instructionsEn,
      email: users.email,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId));
  if (!row) return undefined;
  const locale: Locale = row.locale === "en" ? "en" : "sr";
  return {
    id: row.id,
    amountMinor: row.amountMinor,
    currency: row.currency,
    email: row.email,
    locale,
    productName: locale === "en" ? (row.nameEn ?? row.name) : row.name,
    instructions: locale === "en" ? (row.instructionsEn ?? row.instructions) : row.instructions,
  };
}

/** Sends the right email after a payment was applied (outside the transaction). */
export async function notifyPayment(outcome: PaymentOutcome) {
  const o = await emailContext(outcome.orderId);
  if (!o?.email) return;
  const mail =
    outcome.kind === "delivered"
      ? codeDeliveredEmail({ ...o, code: outcome.code })
      : outcome.kind === "awaiting-details"
        ? manualOrderPaidEmail(o)
        : awaitingStockEmail(o);
  await sendEmail({ to: o.email, ...mail });
}

export async function notifyDelivered(orderId: number) {
  const o = await emailContext(orderId);
  if (!o?.email) return;
  const [code] = await db()
    .select({ code: productCodes.code })
    .from(productCodes)
    .where(eq(productCodes.orderId, orderId));
  await sendEmail({ to: o.email, ...orderDeliveredEmail({ ...o, code: code?.code }) });
}

export async function getUserOrders(userId: string, locale: Locale) {
  return db()
    .select({
      id: orders.id,
      status: orders.status,
      amountMinor: orders.amountMinor,
      currency: orders.currency,
      createdAt: orders.createdAt,
      productName: productName(locale),
      productSlug: products.slug,
      deliveryType: products.deliveryType,
      imageUrl: sql<string | null>`coalesce(${products.imageUrl}, ${categories.thumbUrl}, ${categories.imageUrl})`,
      categoryName: categories.name,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export type UserOrder = Awaited<ReturnType<typeof getUserOrders>>[number];

/** Full order detail — callers must check ownership (or admin) before showing it. */
export async function getOrderDetail(orderId: number, locale: Locale = "en") {
  const [row] = await db()
    .select({
      order: orders,
      product: {
        id: products.id,
        name: productName(locale),
        slug: products.slug,
        deliveryType: products.deliveryType,
        instructions:
          locale === "en"
            ? sql<string | null>`coalesce(${products.instructionsEn}, ${products.instructions})`
            : products.instructions,
        requiredContactFields: products.requiredContactFields,
      },
      user: { id: users.id, email: users.email, displayName: users.displayName },
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId));
  if (!row) return null;

  const [[code], [details]] = await Promise.all([
    db().select({ code: productCodes.code }).from(productCodes).where(eq(productCodes.orderId, orderId)),
    db().select().from(fulfillmentDetails).where(eq(fulfillmentDetails.orderId, orderId)),
  ]);
  return { ...row, code: code?.code ?? null, details: details ?? null };
}
