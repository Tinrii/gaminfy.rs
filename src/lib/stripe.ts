import "server-only";
import Stripe from "stripe";
import { env, requireEnv } from "@/lib/env";

let client: Stripe | undefined;

export function stripe(): Stripe {
  client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return client;
}

/** Checkout is offered only once a Stripe secret key is configured. */
export function paymentsEnabled(): boolean {
  return Boolean(env().STRIPE_SECRET_KEY);
}
