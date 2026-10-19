"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  BadgePercentIcon,
  Loader2Icon,
  LockIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { getCartQuote, startCheckout, type CheckoutState } from "@/app/actions/checkout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/client";
import { plural, t } from "@/i18n/dictionaries";
import type { CartQuote } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";
import { GuestCheckoutDialog } from "./guest-checkout-dialog";
import { Price } from "./price";
import { ProductImage } from "./product-image";

/** Header button with the number of units in the cart. */
export function CartButton({ className }: { className?: string }) {
  const { dict } = useI18n();
  const { count, setOpen } = useCart();
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={() => setOpen(true)}
      aria-label={count ? `${dict.cart.open} (${count})` : dict.cart.open}
      className={cn("relative", className)}
    >
      <ShoppingCartIcon className="size-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}

/** Slide-over cart. Every change is re-priced on the server, so totals always match checkout. */
export function CartSheet() {
  const { locale, dict, href } = useI18n();
  const c = dict.cart;
  const cart = useCart();
  const { items, couponCode, open } = cart;

  // The last server quote and the cart state it was computed for.
  const [result, setResult] = useState<{ key: string; quote: CartQuote | null } | null>(null);
  const [removedNotice, setRemovedNotice] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState>({});
  const [checkingOut, startCheckingOut] = useTransition();
  const { isSignedIn } = useAuth();
  const [guestOpen, setGuestOpen] = useState(false);
  const requestId = useRef(0);

  // Re-quote whenever the drawer is open and the cart changes; stale responses are dropped.
  const key = JSON.stringify([items, couponCode, locale]);
  const quote = result?.quote ?? null;
  const loading = open && items.length > 0 && result?.key !== key;
  useEffect(() => {
    if (!open || items.length === 0) return;
    const id = ++requestId.current;
    getCartQuote({ items, couponCode, locale })
      .then((q) => {
        if (id !== requestId.current) return;
        setResult({ key, quote: q });
        if (q.removedIds.length) {
          cart.removeMany(q.removedIds);
          setRemovedNotice(true);
        }
        if (q.couponError) {
          setCouponError(
            q.couponError === "minSubtotal"
              ? t(c.couponErrors.minSubtotal, { amount: formatPrice(q.couponMinSubtotalMinor ?? 0, q.currency, locale) })
              : c.couponErrors[q.couponError],
          );
          cart.setCouponCode(null);
        }
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setResult((prev) => ({ key, quote: prev?.quote ?? null }));
        setCheckout({ error: "failed" });
      });
    // `key` captures items/coupon/locale; cart helpers are stable enough to leave out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, key]);

  const setOpen = (next: boolean) => {
    if (!next) {
      setRemovedNotice(false);
      setCheckout({});
    }
    cart.setOpen(next);
  };

  const lineFor = (productId: number) => quote?.lines.find((l) => l.productId === productId);
  const shownItems = items.filter((i) => lineFor(i.productId));
  const blocked = !quote || quote.lines.some((l) => l.maxQuantity === 0 || l.quantity > l.maxQuantity);

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    cart.setCouponCode(code.toUpperCase());
    setCouponInput("");
  };

  const goToCheckout = (guestEmail?: string) =>
    startCheckingOut(async () => {
      setCheckout({});
      setCheckout(await startCheckout({ items, couponCode, locale, guestEmail }));
    });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full gap-0 border-white/[0.06] bg-background p-0 sm:max-w-md data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <SheetTitle className="text-lg font-bold">{c.title}</SheetTitle>
            <SheetDescription className="text-xs">
              {cart.count > 0 ? plural(locale, cart.count, c.items) : c.empty}
            </SheetDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label={c.close}>
            <XIcon className="size-5" />
          </Button>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-secondary text-muted-foreground">
              <ShoppingCartIcon className="size-7" />
            </span>
            <div>
              <p className="font-semibold">{c.empty}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.emptyText}</p>
            </div>
            {removedNotice && <p className="text-xs text-gold">{c.removedNotice}</p>}
            <Button asChild className="rounded-xl">
              <Link href={href("/marketplace")} onClick={() => setOpen(false)}>
                {c.browse}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {removedNotice && (
                <Alert className="mb-4">
                  <AlertDescription>{c.removedNotice}</AlertDescription>
                </Alert>
              )}
              {!quote ? (
                <ul className="space-y-3" aria-busy>
                  {items.map((i) => (
                    <li key={i.productId} className="h-20 animate-pulse rounded-2xl bg-card" />
                  ))}
                </ul>
              ) : (
                <ul className="space-y-3">
                  {shownItems.map((item) => {
                    const line = lineFor(item.productId)!;
                    const soldOut = line.maxQuantity === 0;
                    const max = Math.max(1, line.maxQuantity);
                    return (
                      <li key={item.productId} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-card p-3">
                        <Link
                          href={href(`/product/${line.slug}`)}
                          onClick={() => setOpen(false)}
                          className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary"
                        >
                          <ProductImage
                            src={line.imageUrl}
                            alt=""
                            fill
                            sizes="64px"
                            className={cn("object-cover object-top", soldOut && "grayscale")}
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                                {line.categoryName}
                              </p>
                              <Link
                                href={href(`/product/${line.slug}`)}
                                onClick={() => setOpen(false)}
                                className="line-clamp-2 text-sm leading-snug font-semibold hover:text-primary"
                              >
                                {line.name}
                              </Link>
                            </div>
                            <button
                              type="button"
                              onClick={() => cart.remove(item.productId)}
                              aria-label={`${c.remove}: ${line.name}`}
                              className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2Icon className="size-4" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                            {soldOut ? (
                              <span className="text-xs font-semibold text-destructive">{c.soldOut}</span>
                            ) : (
                              <div className="flex items-center rounded-lg border border-white/10">
                                <button
                                  type="button"
                                  onClick={() => cart.setQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  aria-label={c.decrease}
                                  className="grid size-7 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                                >
                                  <MinusIcon className="size-3.5" />
                                </button>
                                <span className="w-7 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => cart.setQuantity(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= max}
                                  aria-label={c.increase}
                                  title={item.quantity >= max ? t(c.maxQuantity, { n: max }) : undefined}
                                  className="grid size-7 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                                >
                                  <PlusIcon className="size-3.5" />
                                </button>
                              </div>
                            )}
                            <Price minor={line.lineTotalMinor} currency={line.currency} className="text-sm font-semibold" />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-4 border-t border-white/[0.06] bg-card/40 px-5 py-4">
              {couponCode && quote?.coupon ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <TagIcon className="size-4 text-primary" />
                    {t(c.couponApplied, { code: quote.coupon.code })}
                  </span>
                  <button
                    type="button"
                    onClick={() => cart.setCouponCode(null)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    {c.removeCoupon}
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="space-y-1.5">
                  <label htmlFor="cart-coupon" className="sr-only">
                    {c.coupon}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="cart-coupon"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError(null);
                      }}
                      placeholder={c.couponPlaceholder}
                      autoComplete="off"
                      maxLength={40}
                      aria-invalid={!!couponError}
                      className="h-10 rounded-xl uppercase placeholder:normal-case"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={!couponInput.trim() || (loading && !!couponCode)}
                      className="h-10 rounded-xl px-4"
                    >
                      {loading && couponCode ? <Loader2Icon className="animate-spin" /> : c.apply}
                    </Button>
                  </div>
                  {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                </form>
              )}

              <dl className={cn("space-y-1.5 text-sm transition-opacity", loading && "opacity-60")}>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{c.subtotal}</dt>
                  <dd>{quote ? <Price minor={quote.subtotalMinor} currency={quote.currency} /> : "—"}</dd>
                </div>
                {quote && quote.discountMinor > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {c.discount}
                      {quote.coupon?.type === "percent" && ` (${quote.coupon.value}%)`}
                    </dt>
                    <dd className="text-emerald-400">
                      −<Price minor={quote.discountMinor} currency={quote.currency} />
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-white/[0.06] pt-2">
                  <dt className="font-semibold">{c.total}</dt>
                  <dd>
                    {quote ? (
                      <Price minor={quote.totalMinor} currency={quote.currency} className="text-xl font-bold text-primary" />
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>

              {quote && quote.savingsMinor > 0 && (
                <p
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2.5 text-sm transition-opacity",
                    loading && "opacity-60",
                  )}
                >
                  <BadgePercentIcon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span>
                    {c.savings.split("{amount}")[0]}
                    <Price minor={quote.savingsMinor} currency={quote.currency} className="font-semibold text-emerald-400" />
                    {c.savings.split("{amount}")[1]}
                  </span>
                </p>
              )}

              {checkout.error && !guestOpen && (
                <Alert variant="destructive">
                  <AlertDescription>{dict.checkout[checkout.error]}</AlertDescription>
                </Alert>
              )}

              <Button
                size="lg"
                onClick={() => (isSignedIn ? goToCheckout() : setGuestOpen(true))}
                disabled={blocked || loading || checkingOut}
                className="h-12 w-full rounded-xl text-base font-semibold"
              >
                {checkingOut ? <Loader2Icon className="animate-spin" /> : <LockIcon />}
                {c.checkout}
              </Button>
              <p className="text-center text-xs text-muted-foreground">{c.secure}</p>
            </div>
            <GuestCheckoutDialog
              open={guestOpen}
              onOpenChange={(next) => {
                setGuestOpen(next);
                setCheckout({});
              }}
              onContinue={goToCheckout}
              pending={checkingOut}
              error={checkout.error && dict.checkout[checkout.error]}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
