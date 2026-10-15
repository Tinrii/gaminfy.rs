"use client";

import { createContext, use, useMemo, useState, useSyncExternalStore } from "react";

export type CartItem = { productId: number; quantity: number };
type Stored = { items: CartItem[]; couponCode: string | null };

const STORAGE_KEY = "gaminfy_cart";
const MAX_QUANTITY = 10;
const EMPTY: Stored = { items: [], couponCode: null };

function read(): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Stored | null;
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY;
    return {
      items: parsed.items.filter((i) => Number.isInteger(i.productId) && i.quantity > 0),
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
  add: (productId: number, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  removeMany: (productIds: number[]) => void;
  setCouponCode: (code: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

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
      add: (productId, quantity = 1) =>
        update((prev) => {
          const existing = prev.items.find((i) => i.productId === productId);
          const items = existing
            ? prev.items.map((i) =>
                i.productId === productId ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QUANTITY) } : i,
              )
            : [...prev.items, { productId, quantity: Math.min(quantity, MAX_QUANTITY) }];
          return { ...prev, items };
        }),
      setQuantity: (productId, quantity) =>
        update((prev) => ({
          ...prev,
          items:
            quantity <= 0
              ? prev.items.filter((i) => i.productId !== productId)
              : prev.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i)),
        })),
      remove: (productId) => update((prev) => ({ ...prev, items: prev.items.filter((i) => i.productId !== productId) })),
      removeMany: (ids) => update((prev) => ({ ...prev, items: prev.items.filter((i) => !ids.includes(i.productId)) })),
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
