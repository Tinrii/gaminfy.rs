import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Coupon } from "@/lib/db/schema";

/** Why a code can't be used — dictionary keys under cart.couponErrors. */
export type CouponError = "notFound" | "expired" | "usedUp" | "minSubtotal";

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Discount in minor units, never more than the subtotal. */
export function discountFor(coupon: Pick<Coupon, "type" | "value">, subtotalMinor: number): number {
  const raw = coupon.type === "percent" ? Math.round((subtotalMinor * coupon.value) / 100) : coupon.value;
  return Math.max(0, Math.min(raw, subtotalMinor));
}

/** Looks up a code and checks it against the cart; returns the coupon or why it fails. */
export async function validateCoupon(
  code: string,
  subtotalMinor: number,
): Promise<{ coupon: Coupon; discountMinor: number } | { error: CouponError; minSubtotalMinor?: number }> {
  const normalized = normalizeCode(code);
  if (!normalized) return { error: "notFound" };

  const [coupon] = await db().select().from(schema.coupons).where(eq(schema.coupons.code, normalized));
  if (!coupon || !coupon.isActive) return { error: "notFound" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return { error: "expired" };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { error: "usedUp" };
  if (coupon.minSubtotalMinor !== null && subtotalMinor < coupon.minSubtotalMinor) {
    return { error: "minSubtotal", minSubtotalMinor: coupon.minSubtotalMinor };
  }
  return { coupon, discountMinor: discountFor(coupon, subtotalMinor) };
}
