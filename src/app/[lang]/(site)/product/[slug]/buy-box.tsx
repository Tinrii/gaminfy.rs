"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useTransition } from "react";
import { Loader2Icon, ZapIcon } from "lucide-react";
import { startCheckout, type CheckoutState } from "@/app/actions/checkout";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { GuestCheckoutDialog } from "@/components/shop/guest-checkout-dialog";
import { OfficialPrice } from "@/components/shop/official-price";
import { Price } from "@/components/shop/price";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import type { ProductVariantOption } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function BuyBox({
  productId,
  productName,
  priceMinor,
  officialPriceMinor,
  officialPriceLabel,
  currency,
  inStock,
  variants = [],
}: {
  productId: number;
  productName: string;
  priceMinor: number;
  officialPriceMinor: number | null;
  /** What the compared price is called (e.g. "Steam Market price" for CS2 skins). */
  officialPriceLabel?: string;
  currency: string;
  inStock: boolean;
  /** Options to pick from (e.g. Standard / Ultimate); each has its own price and stock. */
  variants?: ProductVariantOption[];
}) {
  const { locale, dict } = useI18n();
  const [state, setState] = useState<CheckoutState>({});
  const [pending, startTransition] = useTransition();
  const { isSignedIn } = useAuth();
  const [guestOpen, setGuestOpen] = useState(false);

  // Start on the first option that can be bought.
  const [variantId, setVariantId] = useState(() => (variants.find((v) => v.inStock) ?? variants[0])?.id ?? null);
  const selected = variants.find((v) => v.id === variantId);
  const price = selected?.priceMinor ?? priceMinor;
  const official = selected ? selected.officialPriceMinor : officialPriceMinor;
  const available = selected ? selected.inStock : inStock;
  const lineName = selected ? `${productName} — ${selected.name}` : productName;

  // "Buy now" skips the cart and checks out just this product.
  const buyNow = (guestEmail?: string) =>
    startTransition(async () => {
      setState({});
      setState(await startCheckout({ items: [{ productId, variantId, quantity: 1 }], locale, guestEmail }));
    });

  return (
    <div className="mt-8 rounded-2xl border border-white/[0.06] bg-card p-5">
      {variants.length > 0 && (
        // One card per option (name + price), so they can be compared at a glance.
        <fieldset className="mb-5 border-b border-white/[0.06] pb-5">
          <legend className="mb-3 text-xs text-muted-foreground">{dict.product.chooseOption}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((v) => {
              const checked = v.id === variantId;
              return (
                <label
                  key={v.id}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                    "has-focus-visible:ring-2 has-focus-visible:ring-primary/60",
                    checked
                      ? "border-primary/70 bg-primary/[0.07]"
                      : "border-white/10 bg-background/40 hover:border-white/25 hover:bg-white/[0.03]",
                  )}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={checked}
                    onChange={() => {
                      setVariantId(v.id);
                      setState({});
                    }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4.5 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      checked ? "border-primary" : "border-white/25 group-hover:border-white/40",
                    )}
                  >
                    <span className={cn("size-2 rounded-full bg-primary transition-transform", checked ? "scale-100" : "scale-0")} />
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate font-semibold", !v.inStock && "text-muted-foreground")}>
                    {v.name}
                  </span>
                  {v.inStock ? (
                    <Price
                      minor={v.priceMinor}
                      currency={currency}
                      className={cn("shrink-0 text-sm font-semibold tabular-nums", checked ? "text-primary" : "text-foreground/80")}
                    />
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-destructive">{dict.product.outOfStock}</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{dict.product.price}</p>
          <Price minor={price} currency={currency} className="text-3xl font-bold tracking-tight text-primary" />
          <OfficialPrice
            priceMinor={price}
            officialPriceMinor={official}
            currency={currency}
            label={officialPriceLabel}
            size="lg"
            className="mt-2"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <AddToCartButton productId={productId} variantId={variantId} productName={lineName} disabled={!available} />
          <Button
            type="button"
            size="lg"
            onClick={() => (isSignedIn ? buyNow() : setGuestOpen(true))}
            disabled={!available || pending}
            className="h-12 min-w-40 rounded-xl px-6 text-base font-semibold"
          >
            {pending ? <Loader2Icon className="animate-spin" /> : <ZapIcon />}
            {available ? dict.product.buyNow : dict.product.outOfStock}
          </Button>

        </div>
      </div>
      {state.error && !guestOpen && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{dict.checkout[state.error]}</AlertDescription>
        </Alert>
      )}
      <GuestCheckoutDialog
        open={guestOpen}
        onOpenChange={(next) => {
          setGuestOpen(next);
          setState({});
        }}
        onContinue={buyNow}
        pending={pending}
        error={state.error && dict.checkout[state.error]}
      />
    </div>
  );
}
