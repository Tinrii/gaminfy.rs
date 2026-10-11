"use client";

import { createContext, use, useCallback, useMemo, useSyncExternalStore } from "react";
import { CURRENCIES, CURRENCY_COOKIE, localePath, type Currency, type Locale } from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

type I18nValue = { locale: Locale; dict: Dictionary; href: (path: string) => string };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(
    () => ({ locale, dict: DICTIONARIES[locale], href: (path: string) => localePath(locale, path) }),
    [locale],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): I18nValue {
  const ctx = use(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type Rates = Record<Exclude<Currency, "RSD">, number>;

const CurrencyContext = createContext<{ rates: Rates } | null>(null);

export function CurrencyProvider({ rates, children }: { rates: Rates; children: React.ReactNode }) {
  return <CurrencyContext value={{ rates }}>{children}</CurrencyContext>;
}

// The chosen currency lives in a cookie so it survives reloads; pages stay static
// because the server always renders RSD and the client converts after hydration.
const listeners = new Set<() => void>();
const readCurrency = (): Currency => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([A-Z]{3})`));
  const value = match?.[1] as Currency | undefined;
  return value && CURRENCIES.includes(value) ? value : "RSD";
};

export function useCurrency() {
  const ctx = use(CurrencyContext);
  const currency = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readCurrency,
    () => "RSD" as Currency,
  );
  const setCurrency = useCallback((next: Currency) => {
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    listeners.forEach((l) => l());
  }, []);
  return { currency, setCurrency, rates: ctx?.rates };
}
