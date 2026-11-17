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

/** Labels of a product's account-style code fields, in order (empty = plain codes). */
export function parseCodeFieldLabels(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Stores one account as "Label: value" lines, skipping empty values. */
export function formatCodeFields(labels: string[], values: string[]): string {
  return labels
    .map((label, i) => [label, (values[i] ?? "").trim()] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

/** Splits a multi-line account code back into fields; null for a plain one-line code. */
export function splitCodeFields(code: string): { label: string; value: string }[] | null {
  const lines = code.split("\n");
  if (lines.length < 2) return null;
  const fields = lines.map((line) => {
    const at = line.indexOf(": ");
    return at > 0 ? { label: line.slice(0, at), value: line.slice(at + 2) } : null;
  });
  return fields.every((f) => f !== null) ? fields : null;
}
