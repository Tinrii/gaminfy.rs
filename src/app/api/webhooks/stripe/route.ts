import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { CATALOG_TAG } from "@/lib/catalog";
import { env } from "@/lib/env";
import { applyStripeEvent, markOrderPaid, markOrderUnpaid, notifyPayment } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const webhookSecret = env().STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !env().STRIPE_SECRET_KEY) {
    return new Response("Payments are not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    // Must verify against the raw body, before any JSON parsing.
    event = stripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (!event.type.startsWith("checkout.session.")) return Response.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = Number(session.metadata?.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) return Response.json({ received: true });

  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

  const applied = await applyStripeEvent(event, async (tx) => {
    switch (event.type) {
      case "checkout.session.completed":
        // Delayed methods (bank transfers) complete unpaid and succeed later.
        return session.payment_status === "paid" ? markOrderPaid(tx, orderId, paymentIntent) : null;
      case "checkout.session.async_payment_succeeded":
        return markOrderPaid(tx, orderId, paymentIntent);
      case "checkout.session.async_payment_failed":
        await markOrderUnpaid(tx, orderId, "failed");
        return null;
      case "checkout.session.expired":
        await markOrderUnpaid(tx, orderId, "cancelled");
        return null;
      default:
        return null;
    }
  });

  if (!applied.duplicate && applied.result) {
    revalidateTag(CATALOG_TAG, "max"); // stock changed
    await notifyPayment(applied.result);
  }

  return Response.json({ received: true });
}
