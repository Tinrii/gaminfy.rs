import "server-only";
import { localePath, type Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/format";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const COPY = {
  sr: {
    support: "Kontaktiraj podršku",
    footer: "Gaminfy · Digitalni gejming proizvodi",
    order: "Porudžbina",
    viewOrder: "Pogledaj porudžbinu",
    subtotal: "Međuzbir",
    discount: "Popust",
    total: "Ukupno",
    codesSubject: (id: number) => `Tvoji kodovi su spremni — porudžbina #${id}`,
    codesTitle: "Tvoji kodovi su spremni",
    codesIntro: "Hvala na kupovini! Ovo su tvoji kodovi:",
    paidSubject: (id: number) => `Plaćanje primljeno — porudžbina #${id}`,
    paidTitle: "Plaćanje primljeno",
    paidIntro: "Hvala! Plaćanje je potvrđeno.",
    codesBelow: "Kodovi koji su već spremni nalaze se ispod.",
    manualAction:
      "Za deo porudžbine koji isporučuje naš tim potrebni su nam tvoji kontakt podaci — otvori porudžbinu i popuni ih, traje minut. Nikada ne šalji lozinku.",
    addDetails: "Dodaj podatke za isporuku",
    stockNote: "Neki kodovi trenutno nisu na stanju — naš tim ih priprema i poslaćemo ti ih mejlom čim budu spremni.",
    deliveredSubject: (id: number) => `Isporučeno — porudžbina #${id}`,
    deliveredTitle: "Tvoja porudžbina je isporučena",
    deliveredIntro: "Odlične vesti — porudžbina je završena. Uživaj!",
  },
  en: {
    support: "Contact support",
    footer: "Gaminfy · Digital gaming products",
    order: "Order",
    viewOrder: "View order",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Total",
    codesSubject: (id: number) => `Your codes are ready — Order #${id}`,
    codesTitle: "Your codes are ready",
    codesIntro: "Thanks for your purchase! Here are your codes:",
    paidSubject: (id: number) => `Payment received — Order #${id}`,
    paidTitle: "Payment received",
    paidIntro: "Thanks! Your payment is confirmed.",
    codesBelow: "Codes that are already ready are below.",
    manualAction:
      "For the part of your order our team delivers, we need your contact details — open your order and add them, it only takes a minute.",
    addDetails: "Add delivery details",
    stockNote: "Some codes are out of stock right now — our team is preparing them and we'll email them as soon as they're ready.",
    deliveredSubject: (id: number) => `Delivered — Order #${id}`,
    deliveredTitle: "Your order has been delivered",
    deliveredIntro: "Good news — your order is complete. Enjoy!",
  },
} satisfies Record<Locale, unknown>;

function layout(locale: Locale, title: string, body: string): string {
  const c = COPY[locale];
  return `<!doctype html><html lang="${locale}"><body style="margin:0;background:#001613;font-family:Poppins,Segoe UI,Arial,sans-serif;color:#f1f7f4">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#001613;padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 20px"><img src="${SITE()}/brand/gaminfy-wordmark-white.svg" alt="GAMINFY" height="22" style="display:block"></td></tr>
<tr><td style="background:#03201b;border:1px solid #0d3a2f;border-radius:16px;padding:28px">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#ffffff">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 4px;font-size:12px;color:#8eb0a5">${c.footer} · <a href="${SITE()}${localePath(locale, "/contact")}" style="color:#2ee38a">${c.support}</a></td></tr>
</table></td></tr></table></body></html>`;
}

const p = (text: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#cfe3dc">${text}</p>`;
const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:8px;background:#2ee38a;color:#00140f;font-weight:600;font-size:14px;text-decoration:none;padding:12px 20px;border-radius:10px">${esc(label)}</a>`;
const codeBlock = (code: string) =>
  `<div style="margin:6px 0 10px;padding:14px 16px;border:1px dashed #2ee38a;border-radius:12px;font-family:Consolas,monospace;font-size:17px;letter-spacing:1px;color:#ffffff;word-break:break-all">${esc(code)}</div>`;

export type EmailOrderItem = {
  name: string;
  quantity: number;
  unitPriceMinor: number;
  codes: string[];
  instructions?: string | null;
};

export type EmailOrder = {
  id: number;
  locale: Locale;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  amountMinor: number;
  couponCode: string | null;
  items: EmailOrderItem[];
  /** Order contains products our team delivers by hand. */
  hasManual: boolean;
  /** Some automatic items are still waiting for codes. */
  missingCodes: boolean;
};

function summary(o: EmailOrder) {
  const c = COPY[o.locale];
  const money = (m: number) => formatPrice(m, o.currency, o.locale);
  const row = (left: string, right: string, color = "#cfe3dc", weight = 400) =>
    `<tr><td style="padding:6px 16px;font-size:14px;color:${color};font-weight:${weight}">${left}</td><td align="right" style="padding:6px 16px;font-size:14px;color:${color};font-weight:${weight};white-space:nowrap">${right}</td></tr>`;
  const lines = o.items
    .map((i) =>
      row(
        `${esc(i.name)}${i.quantity > 1 ? ` <span style="color:#8eb0a5">× ${i.quantity}</span>` : ""}`,
        money(i.unitPriceMinor * i.quantity),
        "#ffffff",
      ),
    )
    .join("");
  const discount =
    o.discountMinor > 0
      ? row(c.subtotal, money(o.subtotalMinor)) +
        row(`${c.discount}${o.couponCode ? ` (${esc(o.couponCode)})` : ""}`, `−${money(o.discountMinor)}`, "#2ee38a")
      : "";
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;background:#001613;border-radius:12px;padding:8px 0">
${lines}${discount}${row(c.total, money(o.amountMinor), "#2ee38a", 700)}
<tr><td colspan="2" style="padding:4px 16px 8px;font-size:12px;color:#8eb0a5">${c.order} #${o.id}</td></tr></table>`;
}

function codesSection(o: EmailOrder) {
  return o.items
    .filter((i) => i.codes.length > 0)
    .map(
      (i) =>
        `<p style="margin:14px 0 4px;font-size:13px;font-weight:600;color:#ffffff">${esc(i.name)}</p>` +
        i.codes.map(codeBlock).join("") +
        (i.instructions ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#8eb0a5">${esc(i.instructions)}</p>` : ""),
    )
    .join("");
}

const orderUrl = (o: EmailOrder) => `${SITE()}${localePath(o.locale, `/orders/${o.id}`)}`;

/** Sent once payment is confirmed: codes, a request for delivery details, or both. */
export function orderPaidEmail(o: EmailOrder) {
  const c = COPY[o.locale];
  const complete = !o.hasManual && !o.missingCodes;
  const codes = codesSection(o);
  const body = complete
    ? p(c.codesIntro) + codes + summary(o) + button(orderUrl(o), c.viewOrder)
    : p(c.paidIntro) +
      (o.missingCodes ? p(c.stockNote) : "") +
      (o.hasManual ? p(c.manualAction) : "") +
      (codes ? p(c.codesBelow) + codes : "") +
      summary(o) +
      button(orderUrl(o), o.hasManual ? c.addDetails : c.viewOrder);
  return {
    subject: complete ? c.codesSubject(o.id) : c.paidSubject(o.id),
    html: layout(o.locale, complete ? c.codesTitle : c.paidTitle, body),
  };
}

/** Sent when the team marks an order delivered (includes every code assigned to it). */
export function orderDeliveredEmail(o: EmailOrder) {
  const c = COPY[o.locale];
  return {
    subject: c.deliveredSubject(o.id),
    html: layout(
      o.locale,
      c.deliveredTitle,
      p(c.deliveredIntro) + codesSection(o) + summary(o) + button(orderUrl(o), c.viewOrder),
    ),
  };
}

/** Internal notification to the Gaminfy team — English. */
export function contactEmail(m: { name: string; email: string; message: string }) {
  return {
    subject: `New contact message from ${m.name}`,
    html: layout(
      "en",
      "New contact message",
      p(`<strong style="color:#fff">${esc(m.name)}</strong> &lt;${esc(m.email)}&gt;`) +
        `<div style="padding:16px;background:#001613;border-radius:12px;font-size:14px;line-height:1.6;color:#cfe3dc;white-space:pre-wrap">${esc(m.message)}</div>`,
    ),
  };
}
