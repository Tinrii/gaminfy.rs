export const LOCALES = ["sr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "sr";
export const LOCALE_COOKIE = "gaminfy_lang";

export const LOCALE_LABEL: Record<Locale, string> = { sr: "Srpski", en: "English" };
/** BCP 47 tags for Intl formatting (Serbian in Latin script, like the brand's materials). */
export const INTL_LOCALE: Record<Locale, string> = { sr: "sr-Latn-RS", en: "en-GB" };

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (LOCALES as readonly string[]).includes(v);

/** Serbian lives at the bare path; other languages get a prefix. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** "/en/marketplace" → "/marketplace" (browser pathnames keep the prefix). */
export function stripLocale(pathname: string): string {
  for (const l of LOCALES) {
    if (pathname === `/${l}`) return "/";
    if (pathname.startsWith(`/${l}/`)) return pathname.slice(l.length + 1);
  }
  return pathname;
}

export const CURRENCIES = ["RSD", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_COOKIE = "gaminfy_currency";
