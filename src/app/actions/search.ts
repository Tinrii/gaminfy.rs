"use server";

import { isLocale, type Locale } from "@/i18n/config";
import { getProducts } from "@/lib/catalog";

export type ProductSuggestion = {
  slug: string;
  name: string;
  imageUrl: string | null;
  priceMinor: number;
  currency: string;
  categoryName: string;
};

/** Live product matches for the search boxes (public, read-only, cached per query). */
export async function suggestProducts(input: { q: string; locale: string }): Promise<ProductSuggestion[]> {
  const q = String(input.q ?? "").trim().slice(0, 80);
  if (q.length < 2) return [];
  const locale: Locale = isLocale(input.locale) ? input.locale : "sr";
  const { items } = await getProducts({ locale, q, sort: "featured", limit: 5 });
  return items.map(({ slug, name, imageUrl, priceMinor, currency, categoryName, subcategoryName }) => ({
    slug,
    name,
    imageUrl,
    priceMinor,
    currency,
    categoryName: subcategoryName ?? categoryName,
  }));
}
