import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

/** Current locale from the [lang] root segment (Server Components only). */
async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary; href: (path: string) => string }> {
  const locale = await getLocale();
  return { locale, dict: DICTIONARIES[locale], href: (path) => localePath(locale, path) };
}
