import type { Metadata } from "next";
import { LOCALES, localePath, type Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { LEGAL, SOCIAL_LINKS } from "@/lib/site";

/** Public origin, e.g. https://gaminfy.rs — set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(locale: Locale, path: string): string {
  return `${siteUrl()}${localePath(locale, path)}`;
}

/** Absolute URL for an image that may be a site path (/games/…) or already absolute (R2). */
export function absoluteAsset(src: string): string {
  return src.startsWith("/") ? `${siteUrl()}${src}` : src;
}

/** hreflang map for one logical page in every language, plus x-default (Serbian). */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l === "sr" ? "sr-RS" : "en"] = absoluteUrl(l, path);
  languages["x-default"] = absoluteUrl("sr", path);
  return languages;
}

const OG_LOCALE: Record<Locale, string> = { sr: "sr_RS", en: "en_US" };

/**
 * Complete metadata for a storefront page. Next replaces (not merges) a parent's
 * openGraph/twitter objects, so every page builds the full set through here.
 */
export async function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: {
  title?: string;
  description: string;
  path: string;
  /**
   * Share image. Defaults to the branded /opengraph-image; pass false when the route
   * has its own opengraph-image file (products), so Next.js uses that one instead.
   */
  image?: string | false;
  noIndex?: boolean;
}): Promise<Metadata> {
  const { locale, dict } = await getI18n();
  const url = absoluteUrl(locale, path);
  const fullTitle = title ? `${title} · Gaminfy` : dict.meta.title;
  const images =
    image === false
      ? undefined
      : [
          image
            ? { url: absoluteAsset(image), alt: title ?? "Gaminfy" }
            : { url: absoluteUrl(locale, "/opengraph-image"), width: 1200, height: 630, alt: "Gaminfy" },
        ];

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: "Gaminfy",
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      url,
      title: fullTitle,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Serializes JSON-LD safely for an inline <script> (no "</script>" breakouts). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: LEGAL.company,
    url: siteUrl(),
    logo: `${siteUrl()}/icon.png`,
    ...(LEGAL.email ? { email: LEGAL.email } : {}),
    sameAs: SOCIAL_LINKS.map((s) => s.href),
    areaServed: ["RS", "HR", "BA", "EU"],
  };
}

export function websiteLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: "Gaminfy",
    url: absoluteUrl(locale, "/"),
    inLanguage: locale === "sr" ? "sr-Latn-RS" : "en",
    publisher: { "@id": `${siteUrl()}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(locale, "/marketplace")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
  };
}
