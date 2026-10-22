"use server";

import { z } from "zod";
import type { Dictionary } from "@/i18n/dictionaries";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { contactEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { CS2_WEARS } from "@/lib/site";

type ErrorKey = keyof Dictionary["cs2"]["form"]["errors"];
type Field = "skin" | "contact" | "tradeUrl" | "amount";

export type Cs2RequestState = {
  ok?: boolean;
  /** Dictionary keys — translated on the client. */
  error?: ErrorKey;
  fieldErrors?: Partial<Record<Field, ErrorKey>>;
};

const WEAR_LABEL: Record<(typeof CS2_WEARS)[number], string> = {
  any: "Any",
  fn: "Factory New",
  mw: "Minimal Wear",
  ft: "Field-Tested",
  ww: "Well-Worn",
  bs: "Battle-Scarred",
};

const requestSchema = z.object({
  kind: z.enum(["buy", "sell"]),
  skin: z.string().trim().min(2, "skin").max(120, "skin"),
  wear: z.enum(CS2_WEARS).catch("any"),
  amount: z
    .string()
    .trim()
    .transform((v) => v.replace(",", "."))
    .refine((v) => v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 1_000_000), "amount"),
  tradeUrl: z
    .string()
    .trim()
    .max(300, "tradeUrl")
    .refine((v) => v === "" || /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+/.test(v), "tradeUrl"),
  contact: z.string().trim().min(3, "contact").max(120, "contact"),
  notes: z.string().trim().max(1000),
});

/**
 * Buy/sell requests from the CS2 page. Stored with the contact messages (Admin → Messages)
 * and emailed like them, so nothing is lost if email delivery fails.
 */
export async function sendCs2Request(_prev: Cs2RequestState, formData: FormData): Promise<Cs2RequestState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company")) return { ok: true };

  const parsed = requestSchema.safeParse({
    kind: formData.get("kind"),
    skin: formData.get("skin") ?? "",
    wear: formData.get("wear") ?? "any",
    amount: formData.get("amount") ?? "",
    tradeUrl: formData.get("tradeUrl") ?? "",
    contact: formData.get("contact") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Cs2RequestState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as Field;
      if (key === "skin" || key === "contact" || key === "tradeUrl" || key === "amount") {
        fieldErrors[key] ??= issue.message as ErrorKey;
      }
    }
    return Object.keys(fieldErrors).length ? { fieldErrors } : { error: "generic" };
  }

  const r = parsed.data;
  const buying = r.kind === "buy";
  const email = z.email().safeParse(r.contact).success ? r.contact : "";
  const message = [
    `CS2 request — ${buying ? "BUY (customer wants to buy)" : "SELL (customer wants to sell)"}`,
    `Skin: ${r.skin}`,
    `Wear: ${WEAR_LABEL[r.wear]}`,
    r.amount && `${buying ? "Max budget" : "Asking price"}: €${r.amount}`,
    r.tradeUrl && `Steam Trade URL: ${r.tradeUrl}`,
    `Contact: ${r.contact}`,
    r.notes && `\n${r.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
  const record = { name: `CS2 ${buying ? "buy" : "sell"} · ${r.contact}`.slice(0, 120), email, message };

  try {
    await db().insert(schema.contactMessages).values(record);
  } catch (err) {
    console.error("[cs2] failed to store request", err);
    return { error: "generic" };
  }

  const to = env().CONTACT_EMAIL_TO;
  if (to) await sendEmail({ to, replyTo: email || undefined, ...contactEmail(record) });

  return { ok: true };
}
