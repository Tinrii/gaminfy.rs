import type { Locale } from "@/i18n/config";

export type Testimonial = {
  name: string;
  product: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: Record<Locale, string>;
};

// PLACEHOLDER COPY — replace with real customer reviews (e.g. from Instagram/Discord,
// with the customer's permission) before going live. Publishing invented reviews
// as genuine is misleading to buyers and is not allowed under consumer-protection law.
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marko P.",
    product: "Fortnite V-Bucks",
    rating: 5,
    quote: {
      sr: "Platio sam i za manje od pola sata V-Bucks su bili na nalogu. Sve preko Discorda, bez komplikacija.",
      en: "Paid and the V-Bucks were on my account in under half an hour. All over Discord, no hassle.",
    },
  },
  {
    name: "Jelena S.",
    product: "Brawl Stars",
    rating: 5,
    quote: {
      sr: "Kupujem Brawl Pass ovde svake sezone. Brzo, pošteno i uvek odgovore na poruku.",
      en: "I buy the Brawl Pass here every season. Fast, fair and they always reply.",
    },
  },
  {
    name: "Nikola R.",
    product: "Valorant Points",
    rating: 5,
    quote: {
      sr: "Kod je stigao na mejl odmah posle plaćanja. Aktivirao sam ga za minut.",
      en: "The code hit my inbox right after paying. Redeemed it in a minute.",
    },
  },
  {
    name: "Stefan M.",
    product: "Roblox",
    rating: 5,
    quote: {
      sr: "Objasnili su mi kako da napravim Game Pass, i Robux je legao kako su rekli.",
      en: "They walked me through making the Game Pass and the Robux came through exactly as promised.",
    },
  },
  {
    name: "Ana K.",
    product: "Canva Pro",
    rating: 5,
    quote: {
      sr: "Canva Pro aktiviran na mom nalogu isti dan. Odlična cena za godinu dana.",
      en: "Canva Pro activated on my own account the same day. Great price for a full year.",
    },
  },
  {
    name: "Luka D.",
    product: "Fortnite nalog",
    rating: 4,
    quote: {
      sr: "Nalog je bio tačno kako je opisano, a podrška mi je pomogla da promenim mejl.",
      en: "The account was exactly as described and support helped me change the email.",
    },
  },
  {
    name: "Milica T.",
    product: "GTA V",
    rating: 5,
    quote: {
      sr: "Ključ radi bez problema, igram Online već mesecima. Preporuka!",
      en: "The key works perfectly, I've been playing Online for months. Recommended!",
    },
  },
  {
    name: "Petar J.",
    product: "Fortnite V-Bucks",
    rating: 5,
    quote: {
      sr: "Treći put kupujem, svaki put isto — brzo i sigurno. Najbolja cena koju sam našao.",
      en: "Third time buying, same every time — quick and safe. Best price I've found.",
    },
  },
];
