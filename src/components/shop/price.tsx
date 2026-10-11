"use client";

import { useCurrency, useI18n } from "@/i18n/client";
import { INTL_LOCALE } from "@/i18n/config";
import { formatPrice } from "@/lib/format";

/** Renders an RSD price, converted to the visitor's chosen display currency. */
export function Price({ minor, currency = "RSD", className }: { minor: number; currency?: string; className?: string }) {
  const { locale } = useI18n();
  const { currency: display, rates } = useCurrency();

  let text = formatPrice(minor, currency, locale);
  if (currency === "RSD" && display !== "RSD" && rates) {
    const value = (minor / 100) * rates[display];
    text = `≈ ${new Intl.NumberFormat(INTL_LOCALE[locale], { style: "currency", currency: display }).format(value)}`;
  }
  return <span className={className}>{text}</span>;
}
