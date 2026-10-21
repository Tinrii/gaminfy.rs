import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { AVAILABLE_CODES_SQL } from "@/lib/catalog";
import { db, schema } from "@/lib/db";
import type { OrderStatus } from "@/lib/db/schema";

// Every caller must run requireAdmin() first — these return data across all users.

const { orders, orderItems, coupons, products, productCodes, categories, subcategories, users, contactMessages, fulfillmentDetails } =
  schema;

const freeCodes = sql<number>`${AVAILABLE_CODES_SQL}`;

export async function getAdminOverview() {
  const [needsAction, unpaid, delivered, messages, lowStock, recent] = await Promise.all([
    db().select({ n: count() }).from(orders).where(inArray(orders.status, ["paid", "processing"])),
    db().select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
    db().select({ n: count() }).from(orders).where(eq(orders.status, "delivered")),
    db().select({ n: count() }).from(contactMessages).where(eq(contactMessages.isHandled, false)),
    db()
      .select({ id: products.id, name: products.name, codes: freeCodes })
      .from(products)
      .where(and(eq(products.deliveryType, "automatic"), eq(products.isActive, true)))
      .having(sql`${freeCodes} <= 3`)
      .orderBy(asc(products.name)),
    listOrders({ limit: 40 }),
  ]);
  return {
    needsAction: needsAction[0].n,
    unpaid: unpaid[0].n,
    delivered: delivered[0].n,
    unreadMessages: messages[0].n,
    lowStock: lowStock.map((p) => ({ ...p, codes: Number(p.codes) })),
    recent,
  };
}

export async function listOrders({ status, limit = 100 }: { status?: OrderStatus | "action"; limit?: number }) {
  const where =
    status === "action"
      ? inArray(orders.status, ["paid", "processing"])
      : status
        ? eq(orders.status, status)
        : undefined;
  const rows = await db()
    .select({
      id: orders.id,
      status: orders.status,
      amountMinor: orders.amountMinor,
      currency: orders.currency,
      couponCode: orders.couponCode,
      createdAt: orders.createdAt,
      customer: sql<string>`coalesce(${users.email}, ${orders.guestEmail}, '—')`,
      hasDetails: sql<number>`${fulfillmentDetails.id} is not null`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(fulfillmentDetails, eq(fulfillmentDetails.orderId, orders.id))
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  const lines = rows.length
    ? await db()
        .select({
          orderId: orderItems.orderId,
          name: sql<string>`coalesce(${products.name}, ${orderItems.productName})`,
          quantity: orderItems.quantity,
          deliveryType: products.deliveryType,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, rows.map((r) => r.id)))
        .orderBy(orderItems.id)
    : [];

  return rows.map((r) => {
    const own = lines.filter((l) => l.orderId === r.id);
    return {
      ...r,
      productName: own[0] ? `${own[0].name}${own[0].quantity > 1 ? ` ×${own[0].quantity}` : ""}` : "—",
      /** Other products in the order, for "+2 more". */
      moreCount: Math.max(0, own.length - 1),
      /** "manual" if any line needs hand delivery. */
      deliveryType: own.some((l) => l.deliveryType === "manual") ? ("manual" as const) : ("automatic" as const),
    };
  });
}

export async function listCoupons() {
  return db().select().from(coupons).orderBy(desc(coupons.isActive), desc(coupons.createdAt));
}

export async function listProductsAdmin() {
  const rows = await db()
    .select({
      id: products.id,
      name: products.name,
      nameEn: products.nameEn,
      slug: products.slug,
      categoryId: products.categoryId,
      imageUrl: sql<string | null>`coalesce(${products.imageUrl}, ${categories.thumbUrl}, ${categories.imageUrl})`,
      priceMinor: products.priceMinor,
      currency: products.currency,
      deliveryType: products.deliveryType,
      manualStock: products.manualStock,
      isActive: products.isActive,
      categoryName: categories.name,
      codes: freeCodes,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder), asc(products.sortOrder), asc(products.id));
  return rows.map((r) => ({ ...r, codes: Number(r.codes) }));
}

export type AdminProductRow = Awaited<ReturnType<typeof listProductsAdmin>>[number];

export async function getProductAdmin(id: number) {
  const [product] = await db().select().from(products).where(eq(products.id, id));
  if (!product) return null;
  const codes = await db()
    .select({
      id: productCodes.id,
      code: productCodes.code,
      orderId: productCodes.orderId,
      createdAt: productCodes.createdAt,
    })
    .from(productCodes)
    .where(eq(productCodes.productId, id))
    .orderBy(sql`${productCodes.orderId} is not null`, desc(productCodes.id))
    .limit(500);
  return { product, codes };
}

export async function listCategoriesAdmin() {
  return db()
    .select({
      category: categories,
      products: sql<number>`${sql.raw("(select count(*) from `products` p where p.`category_id` = `categories`.`id`)")}`,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listSubcategoriesAdmin() {
  return db()
    .select({ id: subcategories.id, categoryId: subcategories.categoryId, name: subcategories.name })
    .from(subcategories)
    .orderBy(asc(subcategories.sortOrder), asc(subcategories.name));
}

/** Full rows with product counts, for the category editor. */
export async function listSubcategoriesFull() {
  const rows = await db()
    .select({
      subcategory: subcategories,
      products: sql<number>`${sql.raw("(select count(*) from `products` p where p.`subcategory_id` = `subcategories`.`id`)")}`,
    })
    .from(subcategories)
    .orderBy(asc(subcategories.sortOrder), asc(subcategories.name));
  return rows.map((r) => ({ ...r.subcategory, products: Number(r.products) }));
}

export type AdminSubcategory = Awaited<ReturnType<typeof listSubcategoriesFull>>[number];

export async function listMessages() {
  return db().select().from(contactMessages).orderBy(asc(contactMessages.isHandled), desc(contactMessages.createdAt)).limit(200);
}

export async function unassignedCodeCount(productId: number) {
  const [{ n }] = await db()
    .select({ n: count() })
    .from(productCodes)
    .where(and(eq(productCodes.productId, productId), isNull(productCodes.orderId)));
  return n;
}

/** Image paths already used by categories/products — suggestions for admin image fields. */
export async function listKnownImages(): Promise<string[]> {
  const [cats, prods] = await Promise.all([
    db().select({ a: categories.imageUrl, b: categories.thumbUrl }).from(categories),
    db().selectDistinct({ a: products.imageUrl }).from(products),
  ]);
  const all = [...cats.flatMap((c) => [c.a, c.b]), ...prods.map((p) => p.a)];
  return [...new Set(all.filter((v): v is string => !!v))].sort();
}
