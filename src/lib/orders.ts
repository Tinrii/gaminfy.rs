import "server-only";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderDeliveredEmail, orderPaidEmail, type EmailOrder } from "@/lib/email-templates";

const { orders, orderItems, products, productCodes, users, fulfillmentDetails, stripeEvents, categories, coupons } =
  schema;

type Db = ReturnType<typeof db>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type PaymentOutcome = { orderId: number };

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
 * Assigns unassigned codes to an order's automatic lines (one per unit). Rows are
 * locked with SKIP LOCKED, so two concurrent payments can never take the same code.
 * Returns true when every automatic line is fully covered.
 */
async function assignCodes(tx: Tx, orderId: number): Promise<boolean> {
  const lines = await tx
    .select({ id: orderItems.id, productId: orderItems.productId, quantity: orderItems.quantity })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(and(eq(orderItems.orderId, orderId), eq(products.deliveryType, "automatic")));

  let complete = true;
  const now = new Date();
  for (const line of lines) {
    const [{ have }] = await tx
      .select({ have: sql<number>`count(*)` })
      .from(productCodes)
      .where(eq(productCodes.orderItemId, line.id));
    const missing = line.quantity - Number(have);
    if (missing <= 0) continue;

    const free = await tx
      .select({ id: productCodes.id })
      .from(productCodes)
      .where(and(eq(productCodes.productId, line.productId), isNull(productCodes.orderId)))
      .orderBy(productCodes.id)
      .limit(missing)
      .for("update", { skipLocked: true });

    if (free.length) {
      await tx
        .update(productCodes)
        .set({ orderId, orderItemId: line.id, assignedAt: now })
        .where(inArray(productCodes.id, free.map((c) => c.id)));
    }
    if (free.length < missing) complete = false;
  }
  return complete;
}

/**
 * Moves a pending order to paid and fulfils what it can: codes for automatic lines,
 * stock decrements for manual ones, and one use of the coupon. The order is
 * "delivered" right away only when it is all codes and every code was available.
 */
export async function markOrderPaid(
  tx: Tx,
  orderId: number,
  paymentIntentId: string | null,
): Promise<PaymentOutcome | null> {
  const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
  if (!order || order.status !== "pending") return null;

  const lines = await tx
    .select({ productId: orderItems.productId, quantity: orderItems.quantity, deliveryType: products.deliveryType })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const codesComplete = await assignCodes(tx, orderId);

  for (const line of lines.filter((l) => l.deliveryType === "manual")) {
    await tx
      .update(products)
      .set({ manualStock: sql`greatest(${products.manualStock} - ${line.quantity}, 0)` })
      .where(and(eq(products.id, line.productId), sql`${products.manualStock} is not null`));
  }

  if (order.couponId) {
    await tx
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(eq(coupons.id, order.couponId));
  }

  const hasManual = lines.some((l) => l.deliveryType === "manual");
  const now = new Date();
  const delivered = !hasManual && codesComplete;
  await tx
    .update(orders)
    .set({
      status: delivered ? "delivered" : "paid",
      paidAt: now,
      deliveredAt: delivered ? now : null,
      stripePaymentIntentId: paymentIntentId,
    })
    .where(eq(orders.id, order.id));

  return { orderId: order.id };
}

/** For paid orders that came in while a product was out of codes. Returns true if now complete. */
export async function fillMissingCodes(orderId: number): Promise<"ok" | "partial" | "bad-status"> {
  return db().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order || (order.status !== "paid" && order.status !== "processing")) return "bad-status";
    const complete = await assignCodes(tx, orderId);
    const [{ manual }] = await tx
      .select({ manual: sql<number>`count(*)` })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(eq(orderItems.orderId, orderId), eq(products.deliveryType, "manual")));
    if (complete && Number(manual) === 0) {
      await tx.update(orders).set({ status: "delivered", deliveredAt: new Date() }).where(eq(orders.id, orderId));
    }
    return complete ? "ok" : "partial";
  });
}

export async function markOrderUnpaid(tx: Tx, orderId: number, status: "cancelled" | "failed") {
  await tx
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

/* Detail reads */

const name = (locale: Locale) =>
  locale === "en"
    ? sql<string>`coalesce(${products.nameEn}, ${products.name}, ${orderItems.productName})`
    : sql<string>`coalesce(${products.name}, ${orderItems.productName})`;

/** Lines of one or more orders with their assigned codes, in the given language. */
async function loadItems(orderIds: number[], locale: Locale) {
  if (!orderIds.length) return [];
  const [lines, codes] = await Promise.all([
    db()
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPriceMinor: orderItems.unitPriceMinor,
        name: name(locale),
        slug: products.slug,
        deliveryType: products.deliveryType,
        instructions:
          locale === "en"
            ? sql<string | null>`coalesce(${products.instructionsEn}, ${products.instructions})`
            : products.instructions,
        requiredContactFields: products.requiredContactFields,
        imageUrl: sql<string | null>`coalesce(${products.imageUrl}, ${categories.thumbUrl}, ${categories.imageUrl})`,
        categoryName: categories.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(inArray(orderItems.orderId, orderIds))
      .orderBy(orderItems.id),
    db()
      .select({ orderItemId: productCodes.orderItemId, code: productCodes.code })
      .from(productCodes)
      .where(inArray(productCodes.orderId, orderIds))
      .orderBy(productCodes.id),
  ]);
  return lines.map((l) => ({
    ...l,
    codes: codes.filter((c) => c.orderItemId === l.id).map((c) => c.code),
  }));
}

export type OrderLine = Awaited<ReturnType<typeof loadItems>>[number];

export async function getUserOrders(userId: string, locale: Locale) {
  const rows = await db()
    .select({
      id: orders.id,
      status: orders.status,
      amountMinor: orders.amountMinor,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  const items = await loadItems(
    rows.map((r) => r.id),
    locale,
  );
  return rows.map((r) => {
    const lines = items.filter((i) => i.orderId === r.id);
    const first = lines[0];
    return {
      ...r,
      productName: first?.name ?? "—",
      imageUrl: first?.imageUrl ?? null,
      categoryName: first?.categoryName ?? "",
      /** How many other products the order contains (for "+2"). */
      moreCount: Math.max(0, lines.length - 1),
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    };
  });
}

export type UserOrder = Awaited<ReturnType<typeof getUserOrders>>[number];

/** Full order detail — callers must check ownership (or admin) before showing it. */
export async function getOrderDetail(orderId: number, locale: Locale = "en") {
  const [row] = await db()
    .select({
      order: orders,
      user: { id: users.id, email: users.email, displayName: users.displayName },
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId));
  if (!row) return null;

  const [items, [details]] = await Promise.all([
    loadItems([orderId], locale),
    db().select().from(fulfillmentDetails).where(eq(fulfillmentDetails.orderId, orderId)),
  ]);
  return { ...row, items, details: details ?? null };
}

/* Emails */

async function emailOrder(orderId: number): Promise<{ to: string; order: EmailOrder } | null> {
  const [row] = await db()
    .select({ order: orders, email: users.email })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId));
  if (!row?.email) return null;
  const locale: Locale = row.order.locale === "en" ? "en" : "sr";
  const items = await loadItems([orderId], locale);
  return {
    to: row.email,
    order: {
      id: row.order.id,
      locale,
      currency: row.order.currency,
      subtotalMinor: row.order.subtotalMinor,
      discountMinor: row.order.discountMinor,
      amountMinor: row.order.amountMinor,
      couponCode: row.order.couponCode,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceMinor: i.unitPriceMinor,
        codes: i.codes,
        instructions: i.codes.length ? i.instructions : null,
      })),
      hasManual: items.some((i) => i.deliveryType === "manual"),
      missingCodes: items.some((i) => i.deliveryType === "automatic" && i.codes.length < i.quantity),
    },
  };
}

/** Sends the payment confirmation (with any codes) — outside the payment transaction. */
export async function notifyPayment(outcome: PaymentOutcome) {
  const mail = await emailOrder(outcome.orderId);
  if (mail) await sendEmail({ to: mail.to, ...orderPaidEmail(mail.order) });
}

export async function notifyDelivered(orderId: number) {
  const mail = await emailOrder(orderId);
  if (mail) await sendEmail({ to: mail.to, ...orderDeliveredEmail(mail.order) });
}
