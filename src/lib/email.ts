import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let client: Resend | undefined;

/**
 * Sends a transactional email. When Resend isn't configured yet this logs and
 * returns false instead of throwing, so orders and forms keep working.
 */
export async function sendEmail(message: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const e = env();
  if (!e.RESEND_API_KEY || !e.EMAIL_FROM) {
    console.warn(`[email] Resend not configured — skipped "${message.subject}" to ${message.to}`);
    return false;
  }
  client ??= new Resend(e.RESEND_API_KEY);
  const { error } = await client.emails.send({ from: e.EMAIL_FROM, ...message });
  if (error) {
    console.error("[email] send failed", error);
    return false;
  }
  return true;
}
