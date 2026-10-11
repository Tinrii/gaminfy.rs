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
    codeSubject: (p: string, id: number) => `Tvoj kod za ${p} — porudžbina #${id}`,
    codeTitle: "Tvoj kod je spreman",
    codeIntro: "Hvala na kupovini! Evo tvog koda:",
    paidSubject: (id: number) => `Plaćanje primljeno — porudžbina #${id}`,
    paidTitle: "Plaćanje primljeno",
    manualIntro: "Hvala! Plaćanje je potvrđeno. Da bismo isporučili porudžbinu, potrebno nam je par podataka od tebe.",
    manualAction: "Otvori porudžbinu i javi nam kako da te kontaktiramo — traje minut. Nikada ne šalji lozinku.",
    addDetails: "Dodaj podatke za isporuku",
    stockIntro: "Hvala! Plaćanje je potvrđeno. Naš tim priprema tvoj proizvod i uskoro ćeš ga dobiti — javićemo ti mejlom čim bude gotovo.",
    deliveredSubject: (id: number) => `Isporučeno — porudžbina #${id}`,
    deliveredTitle: "Tvoja porudžbina je isporučena",
    deliveredIntro: "Odlične vesti — porudžbina je završena. Uživaj!",
  },
  en: {
    support: "Contact support",
    footer: "Gaminfy · Digital gaming products",
    order: "Order",
    viewOrder: "View order",
    codeSubject: (p: string, id: number) => `Your ${p} code — Order #${id}`,
    codeTitle: "Your code is ready",
    codeIntro: "Thanks for your purchase! Here's your code:",
    paidSubject: (id: number) => `Payment received — Order #${id}`,
    paidTitle: "Payment received",
    manualIntro: "Thanks! Your payment is confirmed. To deliver your order, our team needs a few details from you.",
    manualAction: "Open your order and tell us how to reach you — it only takes a minute.",
    addDetails: "Add delivery details",
    stockIntro: "Thanks! Your payment is confirmed. Your product is being prepared by our team and will be delivered shortly — we'll email you as soon as it's done.",
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
  `<div style="margin:6px 0 18px;padding:16px;border:1px dashed #2ee38a;border-radius:12px;font-family:Consolas,monospace;font-size:18px;letter-spacing:1px;color:#ffffff;word-break:break-all">${esc(code)}</div>`;

type OrderInfo = { id: number; productName: string; amountMinor: number; currency: string; locale: Locale };

function summary(o: OrderInfo) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;background:#001613;border-radius:12px">
<tr><td style="padding:14px 16px;font-size:14px;color:#ffffff">${esc(o.productName)}</td>
<td align="right" style="padding:14px 16px;font-size:14px;font-weight:600;color:#2ee38a">${formatPrice(o.amountMinor, o.currency, o.locale)}</td></tr>
<tr><td colspan="2" style="padding:0 16px 14px;font-size:12px;color:#8eb0a5">${COPY[o.locale].order} #${o.id}</td></tr></table>`;
}

const orderUrl = (o: OrderInfo) => `${SITE()}${localePath(o.locale, `/orders/${o.id}`)}`;

export function codeDeliveredEmail(o: OrderInfo & { code: string; instructions?: string | null }) {
  const c = COPY[o.locale];
  return {
    subject: c.codeSubject(o.productName, o.id),
    html: layout(
      o.locale,
      c.codeTitle,
      p(c.codeIntro) + codeBlock(o.code) + summary(o) + (o.instructions ? p(esc(o.instructions)) : "") + button(orderUrl(o), c.viewOrder),
    ),
  };
}

export function manualOrderPaidEmail(o: OrderInfo) {
  const c = COPY[o.locale];
  return {
    subject: c.paidSubject(o.id),
    html: layout(o.locale, c.paidTitle, p(c.manualIntro) + summary(o) + p(c.manualAction) + button(orderUrl(o), c.addDetails)),
  };
}

export function awaitingStockEmail(o: OrderInfo) {
  const c = COPY[o.locale];
  return {
    subject: c.paidSubject(o.id),
    html: layout(o.locale, c.paidTitle, p(c.stockIntro) + summary(o) + button(orderUrl(o), c.viewOrder)),
  };
}

export function orderDeliveredEmail(o: OrderInfo & { code?: string | null }) {
  const c = COPY[o.locale];
  return {
    subject: c.deliveredSubject(o.id),
    html: layout(
      o.locale,
      c.deliveredTitle,
      p(c.deliveredIntro) + (o.code ? codeBlock(o.code) : "") + summary(o) + button(orderUrl(o), c.viewOrder),
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
