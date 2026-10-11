"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATALOG_TAG } from "@/lib/catalog";
import { db, schema } from "@/lib/db";
import { CONTACT_FIELD_KEYS } from "@/lib/format";
import { notifyDelivered } from "@/lib/orders";
import { putPublicObject } from "@/lib/storage";
import sharp from "sharp";

const { products, productCodes, categories, orders, contactMessages } = schema;

export type AdminState = { ok?: boolean; error?: string; message?: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 110);

const isDuplicate = (err: unknown) =>
  typeof err === "object" && err !== null && "cause" in err && (err.cause as { code?: string })?.code === "ER_DUP_ENTRY";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  text(max).transform((v) => v || null);
const imagePath = z
  .string()
  .trim()
  .max(512)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Image must be a /path or an https:// URL.")
  .transform((v) => v || null);

const productSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: text(200).min(2, "Serbian name is required."),
  nameEn: optionalText(200),
  slug: text(120),
  categoryId: z.coerce.number().int().positive("Pick a category."),
  price: z.coerce.number().positive("Price must be greater than 0.").max(10_000_000),
  currency: z.string().trim().length(3).toUpperCase().default("RSD"),
  deliveryType: z.enum(["automatic", "manual"]),
  description: optionalText(5000),
  descriptionEn: optionalText(5000),
  instructions: optionalText(5000),
  instructionsEn: optionalText(5000),
  imageUrl: imagePath,
  manualStock: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0), "Stock must be a whole number or empty."),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean(),
  contactFields: z.array(z.enum(CONTACT_FIELD_KEYS)),
});

export async function saveProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    nameEn: formData.get("nameEn") ?? "",
    slug: formData.get("slug") ?? "",
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    currency: formData.get("currency") || "RSD",
    deliveryType: formData.get("deliveryType"),
    description: formData.get("description") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    instructions: formData.get("instructions") ?? "",
    instructionsEn: formData.get("instructionsEn") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    manualStock: formData.get("manualStock") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
    contactFields: formData.getAll("contactFields"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const { id, price, contactFields, slug, ...data } = parsed.data;
  const values = {
    ...data,
    slug: slugify(slug || data.nameEn || data.name),
    priceMinor: Math.round(price * 100),
    requiredContactFields: data.deliveryType === "manual" && contactFields.length ? contactFields.join(",") : null,
    manualStock: data.deliveryType === "manual" ? data.manualStock : null,
  };

  let productId = id;
  try {
    if (id) {
      await db().update(products).set(values).where(eq(products.id, id));
    } else {
      const [res] = await db().insert(products).values(values);
      productId = res.insertId;
    }
  } catch (err) {
    if (isDuplicate(err)) return { error: "Another product already uses that slug." };
    throw err;
  }

  updateTag(CATALOG_TAG);
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  refresh();
  return { ok: true, message: "Product saved." };
}

export async function updateProductPrice(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const price = Number(formData.get("price"));
  if (!Number.isInteger(id) || !Number.isFinite(price) || price <= 0 || price > 10_000_000) {
    return { error: "Enter a valid price." };
  }
  await db().update(products).set({ priceMinor: Math.round(price * 100) }).where(eq(products.id, id));
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Price updated." };
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db()
    .update(products)
    .set({ isActive: sql`not ${products.isActive}` })
    .where(eq(products.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const [{ n }] = await db()
    .select({ n: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.productId, id));

  if (Number(n) > 0) {
    // Keep history intact: products with orders are hidden, not deleted.
    await db().update(products).set({ isActive: false }).where(eq(products.id, id));
  } else {
    await db().transaction(async (tx) => {
      await tx.delete(productCodes).where(eq(productCodes.productId, id));
      await tx.delete(products).where(eq(products.id, id));
    });
  }
  updateTag(CATALOG_TAG);
  redirect("/admin/products");
}

export async function addCodes(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const productId = Number(formData.get("productId"));
  const lines = String(formData.get("codes") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const unique = [...new Set(lines)];
  if (!Number.isInteger(productId) || unique.length === 0) return { error: "Paste at least one code (one per line)." };
  if (unique.some((c) => c.length > 1000)) return { error: "One of the codes is too long." };

  const existing = await db()
    .select({ code: productCodes.code })
    .from(productCodes)
    .where(and(eq(productCodes.productId, productId), inArray(productCodes.code, unique)));
  const known = new Set(existing.map((e) => e.code));
  const fresh = unique.filter((c) => !known.has(c));

  if (fresh.length) await db().insert(productCodes).values(fresh.map((code) => ({ productId, code })));

  updateTag(CATALOG_TAG);
  refresh();
  const skipped = lines.length - fresh.length;
  return {
    ok: true,
    message: `Added ${fresh.length} code${fresh.length === 1 ? "" : "s"}${skipped ? ` (${skipped} duplicate${skipped === 1 ? "" : "s"} skipped)` : ""}.`,
  };
}

export async function deleteCode(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  // Assigned codes are part of an order's history and can't be removed.
  await db().delete(productCodes).where(and(eq(productCodes.id, id), isNull(productCodes.orderId)));
  updateTag(CATALOG_TAG);
  refresh();
}

const ADMIN_STATUSES = ["paid", "processing", "delivered", "cancelled", "refunded"] as const;

export async function updateOrderStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = z.enum(ADMIN_STATUSES).safeParse(formData.get("status"));
  if (!Number.isInteger(id) || !status.success) return { error: "Invalid status." };

  const [order] = await db().select().from(orders).where(eq(orders.id, id));
  if (!order) return { error: "Order not found." };
  if (order.status === status.data) return { ok: true, message: "No change." };
  if (order.status === "pending" && status.data !== "cancelled") {
    return { error: "Unpaid orders can only be cancelled — payment status comes from Stripe." };
  }

  await db()
    .update(orders)
    .set({ status: status.data, deliveredAt: status.data === "delivered" ? new Date() : order.deliveredAt })
    .where(eq(orders.id, id));

  // The customer is only told "delivered" once an admin actually marks it so.
  if (status.data === "delivered") await notifyDelivered(id);

  refresh();
  return { ok: true, message: status.data === "delivered" ? "Marked delivered — customer notified." : "Status updated." };
}

/** For paid automatic orders that came in while the product was out of codes. */
export async function assignCodeToOrder(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const result = await db().transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update");
    if (!order || (order.status !== "paid" && order.status !== "processing")) return "bad-status" as const;
    const [assigned] = await tx.select().from(productCodes).where(eq(productCodes.orderId, id));
    if (assigned) return "already" as const;
    const [code] = await tx
      .select({ id: productCodes.id })
      .from(productCodes)
      .where(and(eq(productCodes.productId, order.productId), isNull(productCodes.orderId)))
      .orderBy(productCodes.id)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!code) return "no-stock" as const;
    const now = new Date();
    await tx.update(productCodes).set({ orderId: id, assignedAt: now }).where(eq(productCodes.id, code.id));
    await tx.update(orders).set({ status: "delivered", deliveredAt: now }).where(eq(orders.id, id));
    return "ok" as const;
  });

  if (result === "no-stock") return { error: "No unassigned codes left — add codes to this product first." };
  if (result === "already") return { error: "This order already has a code." };
  if (result === "bad-status") return { error: "Only paid orders can receive a code." };

  await notifyDelivered(id);
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Code assigned and emailed to the customer." };
}

const categorySchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: text(120).min(2, "Name is required."),
  slug: text(80),
  description: optionalText(255),
  descriptionEn: optionalText(255),
  imageUrl: imagePath,
  thumbUrl: imagePath,
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean(),
});

export async function saveCategory(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    thumbUrl: formData.get("thumbUrl") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const { id, slug, ...data } = parsed.data;
  const values = { ...data, slug: slugify(slug || data.name) };
  try {
    if (id) await db().update(categories).set(values).where(eq(categories.id, id));
    else await db().insert(categories).values(values);
  } catch (err) {
    if (isDuplicate(err)) return { error: "Another category already uses that slug." };
    throw err;
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: id ? "Category saved." : "Category created." };
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const [{ n }] = await db()
    .select({ n: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.categoryId, id));
  // Categories with products are only hidden, so product history stays intact.
  if (Number(n) > 0) await db().update(categories).set({ isActive: false }).where(eq(categories.id, id));
  else await db().delete(categories).where(eq(categories.id, id));
  updateTag(CATALOG_TAG);
  refresh();
}

export async function toggleMessageHandled(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db()
    .update(contactMessages)
    .set({ isHandled: sql`not ${contactMessages.isHandled}` })
    .where(eq(contactMessages.id, id));
  refresh();
}

export type UploadKind = "product" | "categoryCover" | "categoryThumb";
export type UploadResult = { url?: string; error?: string };

const UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Re-encodes an admin-uploaded image to WebP sized for its slot and stores it in R2. */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireAdmin();
  const file = formData.get("file");
  const kind = formData.get("kind") as UploadKind;
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!UPLOAD_TYPES.has(file.type)) return { error: "Use a JPG, PNG, WEBP or AVIF image." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Image is too large (max 4 MB)." };
  if (!["product", "categoryCover", "categoryThumb"].includes(kind)) return { error: "Unknown image slot." };

  let output: Buffer;
  try {
    // Decoding with sharp also rejects files that only pretend to be images.
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 }).rotate();
    const sized =
      kind === "categoryCover"
        ? image.resize(864, 1080, { fit: "cover", position: "attention" })
        : kind === "categoryThumb"
          ? image.resize(256, 256, { fit: "cover", position: "attention" })
          : image.resize(1200, 1200, { fit: "inside", withoutEnlargement: true });
    output = await sized.webp({ quality: 82 }).toBuffer();
  } catch {
    return { error: "That file couldn't be read as an image." };
  }

  try {
    const url = await putPublicObject(kind === "product" ? "products" : "categories", output, "image/webp", "webp");
    return { url };
  } catch (err) {
    console.error("[upload] R2 upload failed", err);
    return { error: err instanceof Error && err.message.includes("not configured") ? err.message : "Upload failed — try again." };
  }
}
