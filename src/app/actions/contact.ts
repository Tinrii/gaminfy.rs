"use server";

import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { contactEmail } from "@/lib/email-templates";
import type { Dictionary } from "@/i18n/dictionaries";
import { env } from "@/lib/env";

type ErrorKey = keyof Dictionary["contact"]["errors"];

export type ContactState = {
  ok?: boolean;
  /** Dictionary keys — translated on the client. */
  error?: ErrorKey;
  fieldErrors?: Partial<Record<"name" | "email" | "message", ErrorKey>>;
  values?: { name: string; email: string; message: string; orderNumber: string };
};

const contactSchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "nameLong"),
  email: z.email("email").max(255, "email"),
  message: z.string().trim().min(10, "message").max(4000, "messageLong"),
});

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    message: String(formData.get("message") ?? ""),
    orderNumber: String(formData.get("orderNumber") ?? "").trim().replace(/^#/, "").slice(0, 20),
  };

  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company")) return { ok: true };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      fieldErrors[key] ??= issue.message as ErrorKey;
    }
    return { fieldErrors, values };
  }

  // The order number is folded into the stored message so the admin sees it at a glance.
  const record = values.orderNumber
    ? { ...parsed.data, message: `Order #${values.orderNumber}\n\n${parsed.data.message}` }
    : parsed.data;

  try {
    await db().insert(schema.contactMessages).values(record);
  } catch (err) {
    console.error("[contact] failed to store message", err);
    return { error: "generic", values };
  }

  const to = env().CONTACT_EMAIL_TO;
  if (to) await sendEmail({ to, replyTo: record.email, ...contactEmail(record) });

  return { ok: true };
}
