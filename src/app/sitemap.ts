import type { MetadataRoute } from "next";
import { LOCALES, type Locale } from "@/i18n/config";
import { getSitemapData } from "@/lib/catalog";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { CS2_CATEGORY } from "@/lib/site";

const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/marketplace", priority: 0.9, changeFrequency: "daily" },
  { path: "/cs2", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.2, changeFrequency: "yearly" },
];

/** One entry per page per language, each listing its translations (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, products } = await getSitemapData();

  const entry = (
    locale: Locale,
    path: string,
    extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
  ): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(locale, path),
    alternates: { languages: languageAlternates(path) },
    ...extra,
  });

  return LOCALES.flatMap((locale) => [
    ...STATIC_PAGES.map((p) => entry(locale, p.path, { priority: p.priority, changeFrequency: p.changeFrequency })),
    // CS2 is listed as /cs2 (its marketplace view redirects there).
    ...categories.filter((c) => c.slug !== CS2_CATEGORY).map((c) =>
      entry(locale, `/marketplace?category=${c.slug}`, { lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.7 }),
    ),
    ...products.map((p) =>
      entry(locale, `/product/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 }),
    ),
  ]);
}
