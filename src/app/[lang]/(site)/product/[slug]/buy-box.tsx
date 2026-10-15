"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, ZapIcon } from "lucide-react";
import { startCheckout, type CheckoutState } from "@/app/actions/checkout";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { Price } from "@/components/shop/price";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function BuyBox({
  productId,
  productName,
  priceMinor,
  currency,
  inStock,
}: {
  productId: number;
  productName: string;
  priceMinor: number;
  currency: string;
  inStock: boolean;
}) {
  const { locale, dict } = useI18n();
  const [state, setState] = useState<CheckoutState>({});
  const [pending, startTransition] = useTransition();

  // "Buy now" skips the cart and checks out just this product.
  const buyNow = () =>
    startTransition(async () => {
      setState(await startCheckout({ items: [{ productId, quantity: 1 }], locale }));
    });

  return (
    <div className="mt-8 rounded-2xl border border-white/[0.06] bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{dict.product.price}</p>
          <Price minor={priceMinor} currency={currency} className="text-3xl font-bold tracking-tight text-primary" />
        </div>
        <div className="flex flex-wrap gap-2">
          <AddToCartButton productId={productId} productName={productName} disabled={!inStock} />
          <Button
            type="button"
            size="lg"
            onClick={buyNow}
            disabled={!inStock || pending}
            className="h-12 min-w-40 rounded-xl px-6 text-base font-semibold"
          >
            {pending ? <Loader2Icon className="animate-spin" /> : <ZapIcon />}
            {inStock ? dict.product.buyNow : dict.product.outOfStock}
          </Button>
        </div>
      </div>
      {state.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{dict.checkout[state.error]}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
