import "server-only";
import { cacheLife } from "next/cache";
import type { Rates } from "@/i18n/client";

// Used when the rates API is unreachable — refreshed daily otherwise.
const FALLBACK: Rates = { EUR: 0.00853, USD: 0.0098 };

/** RSD → EUR/USD display rates. Checkout is always charged in RSD. */
export async function getRates(): Promise<Rates> {
  "use cache";
  cacheLife("days");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/RSD", { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { rates?: Record<string, number> };
    const eur = data.rates?.EUR;
    const usd = data.rates?.USD;
    return eur && usd ? { EUR: eur, USD: usd } : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
