"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/shop/cart-context";

/** After Stripe sends the buyer back, drops what they just bought from the cart. */
export function ClearPurchasedFromCart({ cartKeys, usedCoupon }: { cartKeys: string[]; usedCoupon: boolean }) {
  const success = useSearchParams().get("checkout") === "success";
  const { removeMany, setCouponCode } = useCart();
  const key = cartKeys.join(",");

  useEffect(() => {
    if (!success) return;
    removeMany(cartKeys);
    if (usedCoupon) setCouponCode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, key, usedCoupon]);

  return null;
}
