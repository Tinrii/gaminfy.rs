/**
 * Seeds categories and products from the client's price lists (regular prices, RSD).
 * Serbian is the default copy, English goes in the *_en columns.
 * Idempotent: re-running updates existing rows by slug and never touches codes or orders.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { categories, products, subcategories } from "../src/lib/db/schema";

config({ path: [".env.local", ".env"], quiet: true });

type Delivery = "automatic" | "manual";
type T = { sr: string; en: string };

/** `sub` is the slug of one of the category's subcategories. */
type SeedItem = { name: T; rsd: number; image?: string; description?: T; sub?: string };
type SeedCategory = {
  slug: string;
  name: string;
  nameEn?: string;
  description: T;
  /** Required when the category has items. */
  delivery?: Delivery;
  instructions?: T;
  requiredContactFields?: string;
  /** Icons live at /games/{category}-sub-{slug}.webp, unless `icon: false`. */
  subcategories?: { slug: string; name: T; icon?: false }[];
  /**
   * Listed as subcategory `sub` of a group category seeded earlier (e.g. Brawl Stars in
   * Mobile Games): its products go there, keep this slug prefix and cover, and this
   * category itself stays hidden.
   */
  listedIn?: { category: string; sub: string };
  items: SeedItem[];
};

const sr = (v: number) => v.toLocaleString("sr-Latn-RS");
const en = (v: number) => v.toLocaleString("en-US");
/** Same label in both languages with localized thousands separators, e.g. "1.000 V-Bucks" / "1,000 V-Bucks". */
const amount = (v: number, unit: string): T => ({ sr: `${sr(v)} ${unit}`, en: `${en(v)} ${unit}` });
const same = (v: string): T => ({ sr: v, en: v });

const SUPERCELL: T = {
  sr: "Za isporuku nam je potreban email povezan sa tvojim Supercell ID-jem. Unesi ga u formu nakon plaćanja — isporuka u roku od 1h.",
  en: "We need the email linked to your Supercell ID to deliver. Share it in the order form after payment — delivery within 1 hour.",
};

const CATALOG: SeedCategory[] = [
  {
    slug: "fortnite",
    name: "Fortnite",
    description: { sr: "V-Bucks dopune i full access nalozi sa skinovima.", en: "V-Bucks top-ups and full-access skin accounts." },
    delivery: "manual",
    instructions: {
      sr: "Nakon plaćanja javi nam kako da te kontaktiramo. Naš tim će te kontaktirati da dopuni V-Bucks na tvoj Epic nalog. Isporuka u roku od 1h.",
      en: "After payment, tell us the best way to reach you. Our team will contact you to load the V-Bucks onto your Epic account. Delivery within 1 hour.",
    },
    requiredContactFields: "discord,email,instagram",
    subcategories: [
      { slug: "v-bucks", name: { sr: "Fortnite Vbucksi", en: "Fortnite V-Bucks" } },
      { slug: "packs", name: { sr: "Fortnite Pekovi", en: "Fortnite Packs" } },
      { slug: "random-accounts", name: { sr: "Fortnite random nalozi", en: "Fortnite Random Accounts" } },
      { slug: "accounts", name: { sr: "Fortnite nalozi", en: "Fortnite Accounts" } },
    ],
    items: [
      ...[1000, 2000, 2800, 5000, 10000, 13500].map((v, i) => ({
        name: amount(v, "V-Bucks"),
        rsd: [700, 1400, 1800, 2700, 5200, 6500][i],
        sub: "v-bucks",
      })),
      ...(
        [
          ["10–30", 500],
          ["30–50", 1000],
          ["50–70", 1400],
          ["70–100", 2000],
          ["100–120", 3600],
          ["120–150", 4500],
          ["150–200", 6000],
        ] as const
      ).map(([range, rsd]) => ({
        name: { sr: `Nalog sa ${range} skinova`, en: `${range} Skins Account` },
        rsd,
        sub: "random-accounts",
        image: "/games/fortnite-accounts.webp",
        description: {
          sr: "Full access Fortnite nalog sa nasumičnim skinovima u navedenom rasponu. Može se povezati na PSN, Xbox ili Nintendo. Garancija važi dok ne promeniš email naloga (3 meseca).",
          en: "Full-access Fortnite account with a random selection of skins in the stated range. Can be linked to PSN, Xbox or Nintendo. Warranty is valid until you change the account email (3 months).",
        },
      })),
      {
        name: { sr: "Full Season 3 nalog (20–70 skinova)", en: "Full Season 3 Account (20–70 Skins)" },
        rsd: 2500,
        sub: "accounts",
        image: "/games/fortnite-accounts.webp",
        description: {
          sr: "Full access nalog sa kompletnom Season 3 i 20–70 skinova. Garancija dok ne promeniš email naloga (3 meseca).",
          en: "Full-access account with the complete Season 3 and 20–70 skins. Warranty until you change the account email (3 months).",
        },
      },
    ],
  },
  {
    slug: "mobile-games",
    name: "Mobile Games",
    description: {
      sr: "Gemovi, passovi i UC za Brawl Stars, Clash of Clans i PUBG.",
      en: "Gems, passes and UC for Brawl Stars, Clash of Clans and PUBG.",
    },
    subcategories: [
      { slug: "brawl-stars", name: same("Brawl Stars") },
      { slug: "clash-of-clans", name: same("Clash of Clans") },
      { slug: "pubg", name: same("PUBG") },
    ],
    items: [],
  },
  {
    slug: "roblox",
    name: "Roblox",
    description: { sr: "Robux preko tvog Game Pass-a.", en: "Robux delivered through your own Game Pass." },
    delivery: "manual",
    instructions: {
      sr: "Napravi Game Pass sa cenom za željeni iznos Robux-a i pošalji nam link u formi. Napomena: Roblox drži Robux na čekanju 5 dana nakon kupovine.",
      en: "Create a Game Pass priced for the Robux amount and share its link in the order form. Note: Roblox keeps Robux pending for 5 days after purchase.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [500, 800, 1000, 2000, 5000, 10000].map((v, i) => ({
      name: amount(v, "Robux"),
      rsd: [800, 1100, 1500, 2300, 4500, 9000][i],
    })),
  },
  {
    slug: "gta-v",
    name: "GTA V",
    description: { sr: "Grand Theft Auto V PC Rockstar ključ sa Online modom.", en: "Grand Theft Auto V PC Rockstar key with Online." },
    delivery: "automatic",
    instructions: {
      sr: "Rockstar ključ za aktivaciju stiže na mejl odmah nakon plaćanja. Aktiviraj ga u Rockstar Games Launcher-u. Doživotna garancija.",
      en: "You receive a Rockstar activation key by email right after payment. Redeem it in the Rockstar Games Launcher. Lifetime warranty.",
    },
    items: [{ name: { sr: "GTA V PC Rockstar ključ (Online)", en: "GTA V PC Rockstar Key (Online)" }, rsd: 2350 }],
  },
  {
    slug: "valorant",
    name: "Valorant",
    description: { sr: "Valorant Points kodovi za EU region.", en: "Valorant Points codes for the EU region." },
    delivery: "automatic",
    instructions: {
      sr: "Kod stiže na mejl odmah nakon plaćanja i aktiviraš ga u Valorant prodavnici. Kodovi rade samo na nalozima iz EU regiona.",
      en: "You receive a code by email right after payment and redeem it in the Valorant store. Codes only work on EU-region accounts.",
    },
    items: [475, 1000, 2000, 3650, 5300, 11000].map((v, i) => ({
      name: amount(v, "Valorant Points"),
      rsd: [750, 1400, 2800, 4400, 6000, 12000][i],
    })),
  },
  {
    slug: "rocket-league",
    name: "Rocket League",
    description: { sr: "Rocket League Credits — isporuka u roku od 15 minuta.", en: "Rocket League Credits — delivered within 15 minutes." },
    delivery: "manual",
    instructions: {
      sr: "Nakon plaćanja javi nam kako da te kontaktiramo. Naš tim će te kontaktirati da dopuni Credits na tvoj Rocket League nalog. Isporuka u roku od 15 minuta.",
      en: "After payment, tell us the best way to reach you. Our team will contact you to load the Credits onto your Rocket League account. Delivery within 15 minutes.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [500, 1100, 3000, 6500].map((v, i) => {
      const name = amount(v, "Credits");
      return {
        name,
        rsd: [500, 1000, 2100, 4000][i],
        description: {
          sr: `${name.sr} za Rocket League — isporuka u roku od 15 minuta, doživotna garancija.`,
          en: `${name.en} for Rocket League — delivered within 15 minutes, lifetime warranty.`,
        },
      };
    }),
  },
  {
    slug: "minecraft",
    name: "Minecraft",
    description: { sr: "Full access Minecraft Premium nalozi.", en: "Full-access Minecraft Premium accounts." },
    delivery: "manual",
    instructions: {
      sr: "Full access Premium nalog — igraj na svim serverima. Naš tim šalje podatke naloga nakon plaćanja.",
      en: "Full-access Premium account — play on every server. Our team sends the account details after payment.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [
      { name: same("Minecraft Premium ×1"), rsd: 1700 },
      { name: same("Minecraft Premium ×2"), rsd: 3000 },
    ],
  },
  {
    slug: "digital-subscriptions",
    name: "Digitalne pretplate",
    nameEn: "Digital Subscriptions",
    description: {
      sr: "Spotify, YouTube Premium, Canva Pro i Adobe Creative Cloud.",
      en: "Spotify, YouTube Premium, Canva Pro and Adobe Creative Cloud.",
    },
    subcategories: [
      { slug: "spotify", name: same("Spotify") },
      { slug: "youtube-premium", name: same("YouTube Premium") },
      { slug: "canva-pro", name: same("Canva Pro") },
      { slug: "adobe-creative-cloud", name: same("Adobe Creative Cloud") },
    ],
    items: [],
  },
  {
    slug: "steam",
    name: "Steam",
    description: { sr: "Steam Wallet kodovi u evrima.", en: "Steam Wallet codes in EUR." },
    delivery: "automatic",
    instructions: {
      sr: "Steam Wallet kod stiže na mejl odmah nakon plaćanja. Kodovi se mogu aktivirati samo na nalozima iz EU regiona. Doživotna garancija.",
      en: "You receive a Steam Wallet code by email right after payment. Codes can only be redeemed on EU-region accounts. Lifetime warranty.",
    },
    subcategories: [
      { slug: "wallet", name: same("Steam Wallet") },
      { slug: "games", name: { sr: "Steam igre", en: "Steam Games" } },
    ],
    items: [10, 20, 50, 100].map((v, i) => ({
      name: same(`Steam Wallet €${v}`),
      rsd: [1600, 3000, 6700, 13500][i],
      sub: "wallet",
    })),
  },
  {
    slug: "playstation",
    name: "PlayStation Store",
    description: { sr: "PSN poklon kartice za UK (£) i US ($) naloge.", en: "PSN gift cards for UK (£) and US ($) accounts." },
    delivery: "automatic",
    instructions: {
      sr: "PlayStation Store kod stiže na mejl odmah nakon plaćanja i sam ga aktiviraš. Proveri da region kartice odgovara tvom PSN nalogu.",
      en: "You receive a PlayStation Store code by email right after payment and redeem it yourself. Make sure the card region matches your PSN account.",
    },
    subcategories: [
      { slug: "gift-cards", name: { sr: "PlayStation poklon kartice", en: "PlayStation Gift Cards" } },
      { slug: "games", name: { sr: "PlayStation igre", en: "PlayStation Games" } },
      { slug: "plus", name: same("PlayStation Plus") },
    ],
    items: [
      ...[10, 20, 50, 100, 200].map((v, i) => ({
        name: { sr: `PSN poklon kartica £${v} (UK)`, en: `PSN Gift Card £${v} (UK)` },
        rsd: [1550, 3100, 7500, 14500, 28000][i],
        sub: "gift-cards",
      })),
      ...[10, 25, 50, 100, 200].map((v, i) => ({
        name: { sr: `PSN poklon kartica $${v} (US)`, en: `PSN Gift Card $${v} (US)` },
        rsd: [1300, 3000, 5800, 11300, 22000][i],
        sub: "gift-cards",
      })),
    ],
  },
  {
    slug: "clash-royale",
    name: "Clash Royale",
    description: { sr: "Gemovi i Royale Pass.", en: "Gems and Royale Pass." },
    delivery: "manual",
    instructions: SUPERCELL,
    requiredContactFields: "email",
    items: [
      ...[500, 1200, 2500, 6500, 14000].map((v, i) => ({
        name: { sr: `${sr(v)} gemova`, en: `${en(v)} Gems` },
        rsd: [800, 1350, 2300, 5500, 10500][i],
      })),
      { name: same("Royale Pass"), rsd: 1550 },
    ],
  },
  {
    slug: "ea-fc-26",
    name: "EA Sports FC 26",
    description: { sr: "EA FC 26 Standard i Ultimate izdanje.", en: "EA FC 26 Standard and Ultimate editions." },
    delivery: "manual",
    instructions: {
      sr: "Dobijaš novi Steam nalog sa igrom. Isporuka u roku od 1h nakon plaćanja.",
      en: "You receive a new Steam account with the game. Delivery within 1 hour after payment.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [
      { name: { sr: "EA FC 26 Standard izdanje", en: "EA FC 26 Standard Edition" }, rsd: 5700 },
      { name: { sr: "EA FC 26 Ultimate izdanje", en: "EA FC 26 Ultimate Edition" }, rsd: 7800 },
    ],
  },
  {
    slug: "brawl-stars",
    name: "Brawl Stars",
    listedIn: { category: "mobile-games", sub: "brawl-stars" },
    description: { sr: "Gemovi, Brawl Pass i Brawl Pass+.", en: "Gems, Brawl Pass and Brawl Pass+." },
    delivery: "manual",
    instructions: SUPERCELL,
    requiredContactFields: "email",
    items: [
      { name: { sr: "80 gemova", en: "80 Gems" }, rsd: 800 },
      { name: { sr: "170 gemova", en: "170 Gems" }, rsd: 1400 },
      { name: { sr: "360 gemova", en: "360 Gems" }, rsd: 2500 },
      { name: { sr: "950 gemova", en: "950 Gems" }, rsd: 5800 },
      { name: same("Brawl Pass"), rsd: 1100 },
      { name: same("Brawl Pass+"), rsd: 1500 },
    ],
  },
  {
    slug: "pubg",
    name: "PUBG",
    listedIn: { category: "mobile-games", sub: "pubg" },
    description: { sr: "Unknown Cash (UC) dopune preko tvog PUBG ID-ja.", en: "Unknown Cash (UC) top-ups with your PUBG ID." },
    delivery: "manual",
    instructions: {
      sr: "Potreban nam je samo tvoj PUBG ID — unesi ga u formu nakon plaćanja.",
      en: "All we need is your PUBG player ID — add it to the order form after payment.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [330, 660, 1800, 3850, 8100].map((v, i) => ({
      name: amount(v, "UC"),
      rsd: [700, 1500, 3000, 6000, 11500][i],
    })),
  },
  {
    slug: "spotify",
    name: "Spotify",
    listedIn: { category: "digital-subscriptions", sub: "spotify" },
    description: { sr: "Spotify Premium na 12 meseci.", en: "Spotify Premium for 12 months." },
    delivery: "manual",
    instructions: {
      sr: "Aktivira se na tvom Spotify nalogu. Nakon plaćanja ostavi kontakt i provešćemo te kroz proces — isporuka u roku od 1h.",
      en: "Activated on your own Spotify account. After payment, leave your contact details and we'll guide you through it — delivery within 1 hour.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [{ name: { sr: "Spotify Premium — 12 meseci", en: "Spotify Premium — 12 Months" }, rsd: 3000 }],
  },
  {
    slug: "adobe-creative-cloud",
    name: "Adobe Creative Cloud",
    listedIn: { category: "digital-subscriptions", sub: "adobe-creative-cloud" },
    description: { sr: "Sve Adobe aplikacije na 12 meseci.", en: "All Adobe apps for 12 months." },
    delivery: "manual",
    instructions: {
      sr: "Uključuje sve Adobe aplikacije (20+) i može se koristiti na 2 uređaja. Aktivira se na tvom nalogu — kontaktiraćemo te nakon plaćanja. Garancija 12 meseci.",
      en: "Includes every Adobe app (20+) and can be used on 2 devices. Activated on your own account — we'll contact you after payment. 12-month warranty.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [{ name: { sr: "Adobe Creative Cloud — 12 meseci", en: "Adobe Creative Cloud — 12 Months" }, rsd: 12000 }],
  },
  {
    slug: "canva-pro",
    name: "Canva Pro",
    listedIn: { category: "digital-subscriptions", sub: "canva-pro" },
    description: { sr: "Canva Pro sa premium sadržajem i AI alatima.", en: "Canva Pro with premium content and AI tools." },
    delivery: "manual",
    instructions: {
      sr: "Aktivira se na tvom Canva nalogu, sa pristupom premium sadržaju i AI alatima. Kontaktiraćemo te nakon plaćanja.",
      en: "Activated on your own Canva account, with access to premium content and AI tools. We'll contact you after payment.",
    },
    requiredContactFields: "discord,email,instagram",
    items: [{ name: { sr: "Canva Pro — 12 meseci", en: "Canva Pro — 12 Months" }, rsd: 3600 }],
  },
  {
    // Has its own golden page (/cs2); skins are added in Admin as weekly offers.
    slug: "cs2",
    name: "CS2 skinovi",
    nameEn: "CS2 Skins",
    description: { sr: "Nedeljne ponude CS2 skinova i otkup skinova.", en: "Weekly CS2 skin deals and skin buyback." },
    subcategories: [
      { slug: "knives", name: { sr: "Noževi", en: "Knives" }, icon: false },
      { slug: "gloves", name: { sr: "Rukavice", en: "Gloves" }, icon: false },
      { slug: "ak-47", name: same("AK-47"), icon: false },
      { slug: "awp", name: same("AWP"), icon: false },
      { slug: "m4a1-s", name: same("M4A1-S"), icon: false },
      { slug: "pistols", name: { sr: "Pištolji", en: "Pistols" }, icon: false },
    ],
    items: [],
  },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[£$€]/g, "")
    .replace(/×/g, "x")
    .replace(/\+/g, " plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const defaultDescription = (name: T, delivery: Delivery): T =>
  delivery === "automatic"
    ? { sr: `${name.sr} — instant isporuka digitalnog koda.`, en: `${name.en} — delivered instantly as a digital code.` }
    : { sr: `${name.sr} — isporučuje Gaminfy tim, obično u roku od 1h.`, en: `${name.en} — fulfilled by the Gaminfy team, usually within 1 hour.` };

async function main() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL!, connectionLimit: 2 });
  const db = drizzle({ client: pool });

  // Ids of seeded categories and their subcategories, for categories listed inside a group.
  const seeded = new Map<string, { id: number; subIds: Map<string, number> }>();

  for (const [ci, c] of CATALOG.entries()) {
    const cat = {
      slug: c.slug,
      name: c.name,
      nameEn: c.nameEn ?? null,
      description: c.description.sr,
      descriptionEn: c.description.en,
      imageUrl: `/games/${c.slug}.webp`,
      thumbUrl: `/games/${c.slug}-thumb.webp`,
      sortOrder: ci,
      isActive: !c.listedIn,
    };
    await db
      .insert(categories)
      .values(cat)
      .onDuplicateKeyUpdate({ set: { ...cat, updatedAt: sql`CURRENT_TIMESTAMP` } });
    const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.slug));

    const subIds = new Map<string, number>();
    for (const [si, sub] of (c.subcategories ?? []).entries()) {
      const values = {
        categoryId: row.id,
        slug: sub.slug,
        name: sub.name.sr,
        nameEn: sub.name.en,
        imageUrl: sub.icon === false ? null : `/games/${c.slug}-sub-${sub.slug}.webp`,
        sortOrder: si,
      };
      await db
        .insert(subcategories)
        .values(values)
        .onDuplicateKeyUpdate({ set: { ...values, updatedAt: sql`CURRENT_TIMESTAMP` } });
      const [s] = await db
        .select({ id: subcategories.id })
        .from(subcategories)
        .where(and(eq(subcategories.categoryId, row.id), eq(subcategories.slug, sub.slug)));
      subIds.set(sub.slug, s.id);
    }
    seeded.set(c.slug, { id: row.id, subIds });

    let home = { categoryId: row.id, subcategoryId: (sub?: string) => (sub ? (subIds.get(sub) ?? null) : null) };
    if (c.listedIn) {
      const group = seeded.get(c.listedIn.category);
      const subId = group?.subIds.get(c.listedIn.sub);
      if (!group || !subId) throw new Error(`${c.slug}: seed ${c.listedIn.category} (with ${c.listedIn.sub}) before it.`);
      home = { categoryId: group.id, subcategoryId: () => subId };
    }
    const { delivery, instructions } = c;
    if (!delivery || !instructions) {
      if (c.items.length) throw new Error(`${c.slug}: items need delivery and instructions.`);
      console.log(`✓ ${c.name} (group)`);
      continue;
    }

    for (const [pi, item] of c.items.entries()) {
      // Slugs come from the English name so URLs stay stable.
      const slug = `${c.slug}-${slugify(item.name.en)}`;
      const description = item.description ?? defaultDescription(item.name, delivery);
      const product = {
        categoryId: home.categoryId,
        subcategoryId: home.subcategoryId(item.sub),
        slug,
        name: item.name.sr,
        nameEn: item.name.en,
        description: description.sr,
        descriptionEn: description.en,
        instructions: instructions.sr,
        instructionsEn: instructions.en,
        // Products of a game listed inside a group keep that game's cover.
        imageUrl: item.image ?? (c.listedIn ? `/games/${c.slug}.webp` : null),
        priceMinor: item.rsd * 100,
        currency: "RSD",
        deliveryType: delivery,
        requiredContactFields: delivery === "manual" ? (c.requiredContactFields ?? null) : null,
        sortOrder: pi,
      };
      await db
        .insert(products)
        .values(product)
        .onDuplicateKeyUpdate({ set: { ...product, updatedAt: sql`CURRENT_TIMESTAMP` } });
    }
    console.log(`✓ ${c.name} (${c.items.length})`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
