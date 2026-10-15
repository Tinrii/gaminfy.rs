"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";
import { db, schema } from "@/lib/db";
import { canAccessOrder } from "@/lib/orders";

const { orders, fulfillmentDetails } = schema;

/** Errors are dictionary keys (dict.order.errors) translated on the client. */
export type FulfillmentState = { error?: keyof Dictionary["order"]["errors"]; ok?: boolean };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const schemaIn = z.object({
  orderId: z.coerce.number().int().positive(),
  discordUsername: optionalText(100),
  email: z
    .string()
    .trim()
    .max(255)
    .transform((v) => v || null)
    .refine((v) => v === null || z.email().safeParse(v).success, "email"),
  phone: optionalText(40),
  instagram: optionalText(100),
  notes: optionalText(1000),
});

export async function submitFulfillmentDetails(
  _prev: FulfillmentState,
  formData: FormData,
): Promise<FulfillmentState> {
  const { userId } = await auth();
  const token = formData.get("token");

  const parsed = schemaIn.safeParse({
    orderId: formData.get("orderId"),
    discordUsername: formData.get("discordUsername") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    instagram: formData.get("instagram") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message === "email" ? "email" : "invalid" };

  const { orderId, ...details } = parsed.data;
  if (!details.discordUsername && !details.email && !details.phone && !details.instagram) {
    return { error: "atLeastOne" };
  }

  const [order] = await db().select().from(orders).where(eq(orders.id, orderId));
  // Ownership check on the server — never trust the orderId from the form alone.
  const viewer = { userId, isAdmin: false, token: typeof token === "string" ? token : null };
  if (!order || !canAccessOrder(order, viewer)) return { error: "notFound" };
  if (order.status !== "paid" && order.status !== "processing") {
    return { error: "locked" };
  }

  await db()
    .insert(fulfillmentDetails)
    .values({ orderId, ...details })
    .onDuplicateKeyUpdate({ set: { ...details, updatedAt: new Date() } });

  if (order.status === "paid") {
    await db().update(orders).set({ status: "processing" }).where(eq(orders.id, orderId));
  }

  refresh();
  return { ok: true };
}
