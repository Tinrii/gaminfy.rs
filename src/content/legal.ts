import type { Locale } from "@/i18n/config";

/**
 * Legal documents — DRAFT TEMPLATES prepared for the Gaminfy team.
 * They must be reviewed by a lawyer and completed with the business details in
 * `LEGAL` (src/lib/site.ts) before launch. Paragraph strings may contain the
 * placeholders {company}, {email} and {country}, filled in at render time.
 */

export type LegalSection = { id: string; heading: string; paragraphs?: string[]; list?: string[] };
export type LegalDoc = { title: string; intro: string; updated: string; sections: LegalSection[] };
export type LegalKind = "terms" | "privacy" | "refunds";

const UPDATED = "2026-10-09";

const sr: Record<LegalKind, LegalDoc> = {
  terms: {
    title: "Uslovi korišćenja",
    updated: UPDATED,
    intro:
      "Ovi uslovi uređuju korišćenje sajta Gaminfy i kupovinu digitalnih proizvoda putem njega. Kreiranjem naloga ili kupovinom potvrđuješ da si ih pročitao i da ih prihvataš.",
    sections: [
      {
        id: "o-nama",
        heading: "1. Ko smo",
        paragraphs: [
          "Sajt vodi {company}, sa sedištem u {country} (u daljem tekstu: „Gaminfy”, „mi”). Za sva pitanja možeš nas kontaktirati putem kontakt forme na sajtu ili na {email}.",
        ],
      },
      {
        id: "nalog",
        heading: "2. Korisnički nalog",
        list: [
          "Za kupovinu je potreban nalog. Odgovoran si za tačnost podataka i za čuvanje pristupa svom nalogu.",
          "Moraš imati najmanje 18 godina ili saglasnost roditelja odnosno staratelja.",
          "Zadržavamo pravo da suspendujemo nalog u slučaju zloupotrebe, prevare ili kršenja ovih uslova.",
        ],
      },
      {
        id: "proizvodi",
        heading: "3. Proizvodi",
        paragraphs: [
          "Prodajemo digitalne proizvode: kodove i poklon kartice, dopune valuta u igrama, naloge za igre i pretplate. Gaminfy nije povezan sa izdavačima igara i platformi čiji se proizvodi nalaze u ponudi; svi zaštitni znaci pripadaju njihovim vlasnicima.",
          "Opis, region i način aktivacije navedeni su na stranici svakog proizvoda. Pre kupovine proveri da li proizvod odgovara tvom nalogu i regionu.",
        ],
      },
      {
        id: "cene",
        heading: "4. Cene i plaćanje",
        list: [
          "Cene su izražene u dinarima (RSD). Prikazi u EUR i USD su informativni i mogu se razlikovati od iznosa koji naplaćuje tvoja banka.",
          "Plaćanje se vrši karticom preko Stripe-a. Podaci o kartici se ne čuvaju na našim serverima.",
          "Porudžbina se smatra prihvaćenom tek kada plaćanje bude potvrđeno.",
        ],
      },
      {
        id: "isporuka",
        heading: "5. Isporuka",
        list: [
          "Automatska isporuka: kod se dodeljuje porudžbini i šalje na tvoj email odmah nakon potvrde plaćanja, a vidljiv je i u porudžbini na profilu.",
          "Isporuka preko tima: nakon plaćanja ostavljaš kontakt podatke, a naš tim završava isporuku — po pravilu u roku od 1 sata, osim ako je na proizvodu navedeno drugačije.",
          "Nikada ne tražimo lozinku tvog naloga. Ne šalji lozinke putem sajta ili poruka.",
        ],
      },
      {
        id: "koriscenje",
        heading: "6. Dozvoljeno korišćenje",
        paragraphs: [
          "Proizvodi su namenjeni ličnoj upotrebi. Odgovoran si da korišćenje proizvoda bude u skladu sa pravilima odgovarajuće igre ili platforme. Gaminfy ne odgovara za mere koje izdavač preduzme zbog kršenja njegovih pravila od strane korisnika.",
        ],
      },
      {
        id: "odgovornost",
        heading: "7. Ograničenje odgovornosti",
        paragraphs: [
          "Odgovaramo za isporuku ispravnog proizvoda koji odgovara opisu. Ne odgovaramo za posrednu štetu, prekide servisa izdavača ili gubitke nastale nepravilnom upotrebom proizvoda, u meri u kojoj to dozvoljava zakon. Ništa u ovim uslovima ne ograničava prava koja ti pripadaju po zakonu o zaštiti potrošača.",
        ],
      },
      {
        id: "povracaj",
        heading: "8. Povraćaj novca",
        paragraphs: ["Pravila povraćaja opisana su u Politici povraćaja, koja je sastavni deo ovih uslova."],
      },
      {
        id: "izmene",
        heading: "9. Izmene i merodavno pravo",
        paragraphs: [
          "Možemo izmeniti ove uslove; nova verzija važi od objavljivanja na sajtu, a za već plaćene porudžbine važe uslovi u trenutku kupovine. Na ove uslove primenjuje se pravo Republike Srbije.",
        ],
      },
    ],
  },
  privacy: {
    title: "Politika privatnosti",
    updated: UPDATED,
    intro:
      "Ovde objašnjavamo koje podatke prikupljamo, zašto, kome ih poveravamo i koja prava imaš. Podatke obrađujemo u skladu sa Zakonom o zaštiti podataka o ličnosti Republike Srbije i, gde je primenljivo, GDPR-om.",
    sections: [
      {
        id: "rukovalac",
        heading: "1. Rukovalac podacima",
        paragraphs: ["Rukovalac podacima je {company}, {country}. Kontakt za pitanja o privatnosti: {email}."],
      },
      {
        id: "podaci",
        heading: "2. Koje podatke prikupljamo",
        list: [
          "Podaci naloga: ime, email adresa, profilna slika i povezani Google ili Discord nalog.",
          "Podaci o porudžbinama: kupljeni proizvodi, iznosi, status plaćanja i isporuke, dodeljeni kodovi.",
          "Kontakt podaci za isporuku koje sam uneseš (npr. Discord, email, telefon, Instagram, ID u igri).",
          "Poruke poslate putem kontakt forme.",
          "Tehnički podaci neophodni za rad sajta (npr. kolačići za prijavu, jezik i valutu).",
        ],
      },
      {
        id: "svrha",
        heading: "3. Zašto ih koristimo",
        list: [
          "Izvršenje ugovora: obrada porudžbina, isporuka proizvoda i podrška.",
          "Zakonske obaveze: računovodstvena i poreska evidencija.",
          "Legitimni interes: sprečavanje prevara i zloupotreba, bezbednost sajta.",
        ],
        paragraphs: ["Ne prodajemo tvoje podatke i ne koristimo ih za reklamiranje trećih lica."],
      },
      {
        id: "obradjivaci",
        heading: "4. Kome poveravamo podatke",
        list: [
          "Clerk — prijava i upravljanje nalogom.",
          "Stripe — obrada plaćanja.",
          "Resend — slanje email obaveštenja.",
          "Vercel i naš server baze podataka — hosting sajta i podataka.",
        ],
        paragraphs: [
          "Neki od ovih pružalaca usluga mogu obrađivati podatke van Srbije, uz odgovarajuće mere zaštite predviđene zakonom.",
        ],
      },
      {
        id: "cuvanje",
        heading: "5. Koliko dugo čuvamo podatke",
        paragraphs: [
          "Podatke naloga čuvamo dok nalog postoji. Podatke o porudžbinama čuvamo onoliko koliko zahtevaju propisi o računovodstvu, a kontakt podatke za isporuku i poruke onoliko koliko je potrebno za rešavanje porudžbine ili upita.",
        ],
      },
      {
        id: "kolacici",
        heading: "6. Kolačići",
        paragraphs: [
          "Koristimo samo kolačiće neophodne za rad sajta: prijavu (Clerk), izabrani jezik i izabranu valutu. Ne koristimo kolačiće za praćenje ili oglašavanje.",
        ],
      },
      {
        id: "prava",
        heading: "7. Tvoja prava",
        list: [
          "Pravo na pristup i kopiju podataka.",
          "Pravo na ispravku i dopunu.",
          "Pravo na brisanje, osim podataka koje moramo čuvati po zakonu.",
          "Pravo na ograničenje obrade i prigovor.",
          "Pravo na prenosivost podataka.",
          "Pravo na pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.",
        ],
        paragraphs: ["Zahtev možeš poslati putem kontakt forme ili na {email}."],
      },
    ],
  },
  refunds: {
    title: "Politika povraćaja",
    updated: UPDATED,
    intro:
      "Prodajemo digitalne proizvode koji se isporučuju odmah ili ubrzo nakon plaćanja i koje nije moguće „vratiti”. Zato je prodaja konačna — uz izuzetke navedene ispod.",
    sections: [
      {
        id: "bez-povracaja",
        heading: "1. Nema povraćaja nakon isporuke",
        paragraphs: [
          "Kada je kod dodeljen porudžbini ili je proizvod isporučen na tvoj nalog, porudžbina se ne može otkazati niti refundirati. Kupovinom izričito pristaješ da isporuka počne odmah i potvrđuješ da time gubiš pravo na odustanak od ugovora za digitalni sadržaj, u skladu sa Zakonom o zaštiti potrošača.",
        ],
      },
      {
        id: "izuzeci",
        heading: "2. Kada vraćamo novac",
        list: [
          "Proizvod nije isporučen, a mi nismo u mogućnosti da ga isporučimo.",
          "Kod nije ispravan ili je već iskorišćen pre isporuke — posle provere izdajemo zamenski kod ili vraćamo novac.",
          "Isporučen je pogrešan proizvod u odnosu na porudžbinu.",
          "Plaćanje je naplaćeno dva puta za istu porudžbinu.",
        ],
      },
      {
        id: "ne-vazi",
        heading: "3. Kada povraćaj nije moguć",
        list: [
          "Kupljen je proizvod za pogrešan region ili platformu.",
          "Kod je aktiviran ili proizvod iskorišćen.",
          "Nalog je ograničen ili suspendovan od strane izdavača zbog kršenja njegovih pravila.",
          "Predomislio si se nakon isporuke.",
        ],
      },
      {
        id: "prijava",
        heading: "4. Kako prijaviti problem",
        paragraphs: [
          "Javi nam se putem kontakt forme u roku od 7 dana od kupovine i navedi broj porudžbine i opis problema (po mogućstvu sa snimkom ekrana). Odgovaramo u najkraćem roku.",
        ],
      },
      {
        id: "isplata",
        heading: "5. Kako vraćamo novac",
        paragraphs: [
          "Odobreni povraćaj vraćamo na karticu kojom je plaćeno, preko Stripe-a. Vreme do prikaza na računu zavisi od tvoje banke i obično iznosi 5–10 radnih dana.",
        ],
      },
    ],
  },
};

const en: Record<LegalKind, LegalDoc> = {
  terms: {
    title: "Terms of Service",
    updated: UPDATED,
    intro:
      "These terms govern your use of the Gaminfy website and purchases of digital products through it. By creating an account or placing an order you confirm that you have read and accept them.",
    sections: [
      {
        id: "about",
        heading: "1. Who we are",
        paragraphs: [
          "The site is operated by {company}, based in {country} (“Gaminfy”, “we”). You can reach us through the contact form on the site or at {email}.",
        ],
      },
      {
        id: "account",
        heading: "2. Your account",
        list: [
          "You need an account to buy. You are responsible for keeping your details accurate and your account access secure.",
          "You must be at least 18 years old or have permission from a parent or guardian.",
          "We may suspend accounts involved in abuse, fraud or breaches of these terms.",
        ],
      },
      {
        id: "products",
        heading: "3. Products",
        paragraphs: [
          "We sell digital products: codes and gift cards, in-game currency top-ups, game accounts and subscriptions. Gaminfy is not affiliated with the game publishers or platforms whose products we offer; all trademarks belong to their respective owners.",
          "Each product page lists its description, region and how to activate it. Check that a product matches your account and region before buying.",
        ],
      },
      {
        id: "pricing",
        heading: "4. Prices and payment",
        list: [
          "Prices are in Serbian dinars (RSD). EUR and USD amounts are approximate and may differ from what your bank charges.",
          "Payments are processed by Stripe. Card details are never stored on our servers.",
          "An order is accepted only once payment is confirmed.",
        ],
      },
      {
        id: "delivery",
        heading: "5. Delivery",
        list: [
          "Automatic delivery: a code is assigned to your order and emailed to you as soon as payment is confirmed; it also appears in your order on your profile.",
          "Delivered by our team: after payment you share your contact details and our team completes delivery — usually within 1 hour unless the product page says otherwise.",
        ],
      },
      {
        id: "use",
        heading: "6. Acceptable use",
        paragraphs: [
          "Products are for personal use. You are responsible for using them in line with the rules of the relevant game or platform. Gaminfy is not liable for action a publisher takes because a user broke its rules.",
        ],
      },
      {
        id: "liability",
        heading: "7. Limitation of liability",
        paragraphs: [
          "We are responsible for delivering a working product that matches its description. To the extent permitted by law, we are not liable for indirect losses, publisher service outages or losses caused by improper use. Nothing in these terms limits your statutory consumer rights.",
        ],
      },
      {
        id: "refunds",
        heading: "8. Refunds",
        paragraphs: ["Refunds are handled under our Refund Policy, which forms part of these terms."],
      },
      {
        id: "changes",
        heading: "9. Changes and governing law",
        paragraphs: [
          "We may update these terms; the new version applies from publication, while paid orders remain under the terms in force at the time of purchase. These terms are governed by the laws of the Republic of Serbia.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro:
      "This explains what data we collect, why, who we share it with and what rights you have. We process data under the Serbian Law on Personal Data Protection and, where applicable, the GDPR.",
    sections: [
      {
        id: "controller",
        heading: "1. Data controller",
        paragraphs: ["The data controller is {company}, {country}. Privacy questions: {email}."],
      },
      {
        id: "data",
        heading: "2. What we collect",
        list: [
          "Account data: name, email address, profile picture and any linked Google or Discord account.",
          "Order data: products bought, amounts, payment and delivery status, assigned codes.",
          "Delivery contact details you provide (e.g. Discord, email, phone, Instagram, in-game ID).",
          "Messages sent through the contact form.",
          "Technical data needed to run the site (e.g. cookies for sign-in, language and currency).",
        ],
      },
      {
        id: "purpose",
        heading: "3. Why we use it",
        list: [
          "Performing our contract: processing orders, delivering products and support.",
          "Legal obligations: accounting and tax records.",
          "Legitimate interest: preventing fraud and abuse, keeping the site secure.",
        ],
        paragraphs: ["We do not sell your data or use it for third-party advertising."],
      },
      {
        id: "processors",
        heading: "4. Who we share it with",
        list: [
          "Clerk — sign-in and account management.",
          "Stripe — payment processing.",
          "Resend — email notifications.",
          "Vercel and our database server — hosting the site and data.",
        ],
        paragraphs: ["Some of these providers may process data outside Serbia, with the safeguards required by law."],
      },
      {
        id: "retention",
        heading: "5. How long we keep it",
        paragraphs: [
          "Account data is kept while your account exists. Order records are kept as long as accounting rules require; delivery contact details and messages only as long as needed to resolve the order or enquiry.",
        ],
      },
      {
        id: "cookies",
        heading: "6. Cookies",
        paragraphs: [
          "We only use cookies needed for the site to work: sign-in (Clerk), your chosen language and your chosen currency. We do not use tracking or advertising cookies.",
        ],
      },
      {
        id: "rights",
        heading: "7. Your rights",
        list: [
          "Access and a copy of your data.",
          "Correction and completion.",
          "Erasure, except data we must keep by law.",
          "Restriction of processing and objection.",
          "Data portability.",
          "Complaint to the Serbian Commissioner for Information of Public Importance and Personal Data Protection.",
        ],
        paragraphs: ["Send requests through the contact form or to {email}."],
      },
    ],
  },
  refunds: {
    title: "Refund Policy",
    updated: UPDATED,
    intro:
      "We sell digital products that are delivered immediately or shortly after payment and cannot be “returned”. All sales are therefore final — with the exceptions below.",
    sections: [
      {
        id: "no-refunds",
        heading: "1. No refunds after delivery",
        paragraphs: [
          "Once a code has been assigned to your order or a product has been delivered to your account, the order cannot be cancelled or refunded. By purchasing you expressly agree that delivery starts immediately and acknowledge that you thereby lose the right to withdraw from a contract for digital content, as provided by consumer protection law.",
        ],
      },
      {
        id: "exceptions",
        heading: "2. When we do refund",
        list: [
          "The product was not delivered and we are unable to deliver it.",
          "The code does not work or was already used before delivery — after checking, we send a replacement or refund you.",
          "A different product was delivered than the one ordered.",
          "You were charged twice for the same order.",
        ],
      },
      {
        id: "not-eligible",
        heading: "3. When a refund isn't possible",
        list: [
          "You bought a product for the wrong region or platform.",
          "The code has been redeemed or the product used.",
          "The publisher restricted or suspended your account for breaking its rules.",
          "You changed your mind after delivery.",
        ],
      },
      {
        id: "report",
        heading: "4. How to report a problem",
        paragraphs: [
          "Contact us through the contact form within 7 days of purchase with your order number and a description of the issue (a screenshot helps). We respond as quickly as possible.",
        ],
      },
      {
        id: "payout",
        heading: "5. How refunds are paid",
        paragraphs: [
          "Approved refunds go back to the card used for payment, via Stripe. How long it takes to appear depends on your bank — usually 5–10 business days.",
        ],
      },
    ],
  },
};

export const LEGAL_DOCS: Record<Locale, Record<LegalKind, LegalDoc>> = { sr, en };
