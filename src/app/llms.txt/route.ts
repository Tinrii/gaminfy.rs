import { getSitemapData } from "@/lib/catalog";
import { LEGAL } from "@/lib/site";
import { absoluteUrl } from "@/lib/seo";

/**
 * llms.txt (https://llmstxt.org) — a plain-Markdown map of the site for AI assistants:
 * what Gaminfy sells, how ordering and delivery work, and where the key pages are.
 */
export async function GET() {
  const { categories } = await getSitemapData();
  const en = (path: string) => absoluteUrl("en", path);
  const sr = (path: string) => absoluteUrl("sr", path);

  const body = `# Gaminfy

> Gaminfy is an online store for digital gaming products — in-game currency top-ups (V-Bucks, Robux, Valorant Points, PUBG UC, Brawl Stars and Clash Royale gems), gift cards (Steam Wallet, PlayStation Store), game accounts and subscriptions (Spotify Premium, Adobe Creative Cloud, Canva Pro). It serves players in Serbia, Croatia, Bosnia and Herzegovina and the European Union. Prices are in Serbian dinars (RSD).

The site is available in Serbian (default, ${sr("/")}) and English (${en("/")}).

## How ordering works

- Customers create an account, choose a product and pay by card through Stripe.
- Automatic delivery: codes (Steam, PlayStation, Valorant, GTA V) are emailed immediately after payment and shown in the order.
- Delivered by the team: top-ups that need the customer's account are completed by the Gaminfy team, usually within 1 hour, after the customer shares contact details. Gaminfy never asks for account passwords.
- Digital products are non-refundable once delivered, except when a product was not delivered, a code does not work, the wrong product was sent, or a payment was charged twice.

## Main pages

- [Marketplace](${en("/marketplace")}): all products with prices, filters and search
- [About](${en("/about")}): who runs Gaminfy and how delivery works
- [Contact](${en("/contact")}): contact form and frequently asked questions

## Games and services

${categories.map((c) => `- [${c.name}](${en(`/marketplace?category=${c.slug}`)})${c.description ? `: ${c.description}` : ""}`).join("\n")}

## Policies

- [Terms of Service](${en("/terms")})
- [Privacy Policy](${en("/privacy")})
- [Refund Policy](${en("/refund-policy")})

## Contact

${LEGAL.email ? `- Email: ${LEGAL.email}\n` : ""}- Contact form: ${en("/contact")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
