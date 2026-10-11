import "server-only";
import { z } from "zod";

// Treat empty strings (e.g. `STRIPE_SECRET_KEY=`) as unset.
const optional = <T extends z.ZodType>(s: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), s.optional());

const schema = z.object({
  DATABASE_URL: z.string().url(),
  /** "true" to require TLS to MariaDB (recommended once the server has a certificate). */
  DATABASE_SSL: z.enum(["true", "false"]).default("false"),
  ADMIN_USER_IDS: z.string().default(""),
  // Optional until payments / email are wired up; stripe() and resend() require them.
  STRIPE_SECRET_KEY: optional(z.string().startsWith("sk_")),
  STRIPE_WEBHOOK_SECRET: optional(z.string().startsWith("whsec_")),
  RESEND_API_KEY: optional(z.string().startsWith("re_")),
  EMAIL_FROM: optional(z.string().min(1)),
  CONTACT_EMAIL_TO: optional(z.string().email()),
  // Cloudflare R2 for admin image uploads; uploads are disabled until all five are set.
  R2_ACCOUNT_ID: optional(z.string().min(1)),
  R2_ACCESS_KEY_ID: optional(z.string().min(1)),
  R2_SECRET_ACCESS_KEY: optional(z.string().min(1)),
  R2_BUCKET: optional(z.string().min(1)),
  /** Public base URL of the bucket, e.g. https://pub-xxxx.r2.dev or https://cdn.gaminfy.rs */
  R2_PUBLIC_URL: optional(z.string().url()),
});

type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/**
 * Validated server-only environment. Parsed lazily so `next build` works
 * without production secrets present; the first request that needs them fails loudly.
 */
export function env(): ServerEnv {
  cached ??= schema.parse(process.env);
  return cached;
}

/** Returns an optional env value, throwing a clear error if the feature needing it is used. */
export function requireEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = env()[key];
  if (value === undefined || value === null) throw new Error(`Missing environment variable ${key}`);
  return value as NonNullable<ServerEnv[K]>;
}
