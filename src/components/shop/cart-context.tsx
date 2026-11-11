"use client";

import { createContext, use, useMemo, useState, useSyncExternalStore } from "react";
import { cartKey } from "@/lib/cart-key";

/** variantId is set for products sold through options (e.g. Standard / Ultimate). */
export type CartItem = { productId: number; variantId: number | null; quantity: number };
type Stored = { items: CartItem[]; couponCode: string | null };

const STORAGE_KEY = "gaminfy_cart";
const MAX_QUANTITY = 10;
const EMPTY: Stored = { items: [], couponCode: null };

function read(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Stored | null;
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY;
    return {
      // Carts saved before options existed have no variantId.
      items: parsed.items
        .filter((i) => Number.isInteger(i.productId) && i.quantity > 0)
        .map((i) => ({ ...i, variantId: Number.isInteger(i.variantId) ? i.variantId : null })),
      couponCode: typeof parsed.couponCode === "string" ? parsed.couponCode : null,
    };
  } catch {
    return EMPTY;
  }
}

/* A tiny external store over localStorage, shared by every component and synced across tabs. */

let snapshot: Stored | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Stored {
  snapshot ??= read();
  return snapshot;
}

const getServerSnapshot = () => EMPTY;

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    snapshot = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(fn: (prev: Stored) => Stored) {
  snapshot = fn(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private mode / storage full: the cart still works for this page view.
  }
  listeners.forEach((l) => l());
}

type CartValue = {
  items: CartItem[];
  couponCode: string | null;
  /** Total units in the cart (for the header badge). */
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (productId: number, quantity?: number, variantId?: number | null) => void;
  /** The line methods take cartKey(productId, variantId). */
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  removeMany: (keys: string[]) => void;
  setCouponCode: (code: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

const keyOf = (i: CartItem) => cartKey(i.productId, i.variantId);

/**
 * Cart kept in localStorage so it survives reloads and works before sign-in.
 * Prices and stock are never taken from here — the server re-quotes every time.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  // The server (and hydration) render an empty cart; the stored one appears right after.
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);

  const value = useMemo<CartValue>(
    () => ({
      items: state.items,
      couponCode: state.couponCode,
      count: state.items.reduce((sum, i) => sum + i.quantity, 0),
      open,
      setOpen,
      add: (productId, quantity = 1, variantId = null) =>
        update((prev) => {
          const key = cartKey(productId, variantId);
          const existing = prev.items.find((i) => keyOf(i) === key);
          const items = existing
            ? prev.items.map((i) =>
                keyOf(i) === key ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QUANTITY) } : i,
              )
            : [...prev.items, { productId, variantId, quantity: Math.min(quantity, MAX_QUANTITY) }];
          return { ...prev, items };
        }),
      setQuantity: (key, quantity) =>
        update((prev) => ({
          ...prev,
          items:
            quantity <= 0
              ? prev.items.filter((i) => keyOf(i) !== key)
              : prev.items.map((i) => (keyOf(i) === key ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i)),
        })),
      remove: (key) => update((prev) => ({ ...prev, items: prev.items.filter((i) => keyOf(i) !== key) })),
      removeMany: (keys) => update((prev) => ({ ...prev, items: prev.items.filter((i) => !keys.includes(keyOf(i))) })),

      setCouponCode: (couponCode) => update((prev) => ({ ...prev, couponCode })),
      clear: () => update(() => EMPTY),
    }),
    [state, open],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartValue {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
