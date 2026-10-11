import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { OrderStatus } from "@/lib/db/schema";

/** 140000 (minor units) → "1.400 RSD" (sr) / "1,400 RSD" (en) — matches the client's price lists. */
export function formatPrice(minor: number, currency = "RSD", locale: Locale = "sr"): string {
  const major = minor / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  const n = major.toLocaleString(INTL_LOCALE[locale], { minimumFractionDigits: digits, maximumFractionDigits: 2 });
  return `${n} ${currency}`;
}

export function formatDate(date: Date, locale: Locale = "en"): string {
  return date.toLocaleDateString(INTL_LOCALE[locale], { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date, locale: Locale = "en"): string {
  return date.toLocaleString(INTL_LOCALE[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** English labels for the admin panel (the storefront uses the dictionaries). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  processing: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment failed",
  refunded: "Refunded",
};

export const CONTACT_FIELD_KEYS = ["discord", "email", "phone", "instagram"] as const;
export type ContactField = (typeof CONTACT_FIELD_KEYS)[number];

export const CONTACT_FIELD_LABEL: Record<ContactField, string> = {
  discord: "Discord",
  email: "Email",
  phone: "Phone",
  instagram: "Instagram",
};

export function parseContactFields(value: string | null | undefined): ContactField[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ContactField => (CONTACT_FIELD_KEYS as readonly string[]).includes(s));
}
