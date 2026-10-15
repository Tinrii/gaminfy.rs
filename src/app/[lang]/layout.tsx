import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { srRS } from "@clerk/localizations";
import { CartProvider } from "@/components/shop/cart-context";
import { CartSheet } from "@/components/shop/cart-sheet";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider, I18nProvider } from "@/i18n/client";
import { LOCALES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { getRates } from "@/lib/rates";
import { organizationLd, siteUrl, websiteLd } from "@/lib/seo";
import { JsonLd } from "@/components/site/json-ld";
import "../globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dict } = await getI18n();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.title, template: "%s · Gaminfy" },
    description: dict.meta.description,
    applicationName: "Gaminfy",
    keywords:
      locale === "sr"
        ? ["V-Bucks", "Robux", "Valorant Points", "Steam Wallet", "PlayStation kartice", "dopune za igre", "PUBG UC", "Brawl Stars gemovi", "Srbija"]
        : ["V-Bucks", "Robux", "Valorant Points", "Steam Wallet", "PlayStation gift cards", "game top-ups", "PUBG UC", "Brawl Stars gems", "Serbia"],
    formatDetection: { telephone: false, email: false, address: false },
    openGraph: { type: "website", siteName: "Gaminfy", locale: locale === "sr" ? "sr_RS" : "en_US" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#001613",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [{ locale }, rates] = await Promise.all([getI18n(), getRates()]);

  return (
    <html lang={locale === "sr" ? "sr-Latn" : "en"} className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <JsonLd data={[organizationLd(), websiteLd(locale)]} />
        <ClerkProvider appearance={clerkAppearance} localization={locale === "sr" ? srRS : undefined}>
          <I18nProvider locale={locale}>
            <CurrencyProvider rates={rates}>
              <CartProvider>
                {children}
                <CartSheet />
              </CartProvider>
            </CurrencyProvider>
          </I18nProvider>
          <Toaster position="bottom-right" offset={{ bottom: 96, right: 24 }} mobileOffset={{ bottom: 88 }} />
        </ClerkProvider>
      </body>
    </html>
  );
}
