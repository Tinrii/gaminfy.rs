"use client";

import { useActionState } from "react";
import { Loader2Icon, ShoppingCartIcon } from "lucide-react";
import { startCheckout, type CheckoutState } from "@/app/actions/checkout";
import { Price } from "@/components/shop/price";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function BuyBox({
  productId,
  priceMinor,
  currency,
  inStock,
}: {
  productId: number;
  priceMinor: number;
  currency: string;
  inStock: boolean;
}) {
  const { locale, dict } = useI18n();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});

  return (
    <form action={action} className="mt-8 rounded-2xl border border-white/[0.06] bg-card p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{dict.product.price}</p>
          <Price minor={priceMinor} currency={currency} className="text-3xl font-bold tracking-tight text-primary" />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!inStock || pending}
          className="h-12 min-w-44 rounded-xl px-6 text-base font-semibold"
        >
          {pending ? <Loader2Icon className="animate-spin" /> : <ShoppingCartIcon />}
          {inStock ? dict.product.buyNow : dict.product.outOfStock}
        </Button>
      </div>
      {state.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{dict.checkout[state.error]}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
