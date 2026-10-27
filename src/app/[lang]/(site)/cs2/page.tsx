import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRightIcon,
  BadgeDollarSignIcon,
  CrosshairIcon,
  HandCoinsIcon,
  KeyRoundIcon,
  MessageCircleIcon,
  RepeatIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { OfficialPrice } from "@/components/shop/official-price";
import { Price } from "@/components/shop/price";
import { ProductImage } from "@/components/shop/product-image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";
import { getProducts, getSubcategories, type ProductCard } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { CS2_CATEGORY } from "@/lib/site";
import { Cs2Offers } from "./offers";
import { Cs2RequestForm } from "./request-form";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return pageMetadata({ title: dict.cs2.title, description: dict.cs2.metaDescription, path: "/cs2" });
}

const TRUST_ICONS = [RepeatIcon, KeyRoundIcon, MessageCircleIcon];

/**
 * CS2 skin market: weekly offers (products of the CS2 category, managed in Admin),
 * buy/sell requests and FAQ — on the client's gold artwork. `data-theme="gold"` turns
 * the whole document gold while this page is open (see globals.css).
 */
export default async function Cs2Page() {
  const { dict } = await getI18n();
  const c = dict.cs2;

  return (
    // overflow-x-clip (not hidden) trims the hero glow at the screen edge without breaking the sticky background.
    <div data-theme="gold" className="relative isolate overflow-x-clip">
      <GoldBackground />

      <section className="relative isolate pt-[4.5rem]">
        {/* CS2 key art in gold (like the home hero's artwork), faded out at the bottom so the gold background continues below. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]">
          <Image
            src="/cs2/hero-bg.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-25 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 to-transparent" />
        </div>
        <div className="container-page grid items-center gap-10 pt-8 pb-16 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">
              <CrosshairIcon className="size-3.5" /> {c.badge}
            </span>
            <h1 className="mt-5 bg-[linear-gradient(180deg,#fff6d2,#f4c430_55%,#b8860b)] bg-clip-text text-[clamp(2.4rem,5.5vw,4.25rem)] leading-[1.02] font-bold tracking-tight text-transparent uppercase">
              {c.heading}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">{c.intro}</p>
            <div className="mt-8 grid gap-3 sm:flex">
              <Button asChild size="lg" className="h-12 rounded-xl px-8 font-semibold uppercase shadow-lg shadow-primary/25">
                <a href="#ponude">
                  <ShoppingCartIcon /> {c.buy}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-primary/60 bg-transparent px-8 font-semibold text-primary uppercase hover:bg-primary/10 hover:text-primary"
              >
                <a href="#otkup">
                  <HandCoinsIcon /> {c.sell}
                </a>
              </Button>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {c.trust.map(({ title, text }, i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <li key={title} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">{text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative -order-1 lg:order-none">
            <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-primary/20 blur-3xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-primary/30 shadow-2xl shadow-black/50 lg:aspect-square">
              <Image src="/cs2/hero.webp" alt="" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<OffersSkeleton />}>
        <Offers />
      </Suspense>

      <Reveal>
        <section className="container-page pb-20">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { href: "#kupovina", icon: ShoppingCartIcon, title: c.requestBuyTitle, text: c.requestBuyText },
              { href: "#otkup", icon: BadgeDollarSignIcon, title: c.requestSellTitle, text: c.requestSellText },
            ].map(({ href, icon: Icon, title, text }) => (
              <a
                key={href}
                data-reveal
                href={href}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-card/70 p-5 backdrop-blur transition-colors hover:border-primary/50"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page pb-20">
          <h2 data-reveal className="text-2xl font-bold tracking-tight sm:text-3xl">
            {c.stepsTitle}
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {[c.buySteps, c.sellSteps].map((group) => (
              <div key={group.title} data-reveal className="rounded-3xl border border-white/10 bg-card/70 p-6 backdrop-blur sm:p-8">
                <h3 className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">{group.title}</h3>
                <ol className="mt-6 space-y-6">
                  {group.steps.map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/40 text-sm font-bold text-primary tabular-nums">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block font-semibold">{step.title}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{step.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      <section className="relative container-page pb-20">
        {/* Targets for the page's buy / sell links; the form switches tab to match. */}
        <span id="kupovina" className="absolute -top-24" />
        <span id="otkup" className="absolute -top-24" />
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-primary/25 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur">
          <Cs2RequestForm />
        </div>
      </section>

      <Reveal>
        <section className="container-page pb-28">
          <h2 data-reveal className="text-2xl font-bold tracking-tight sm:text-3xl">
            {c.faqTitle}
          </h2>
          <Accordion data-reveal type="single" collapsible className="mt-6 rounded-3xl border border-white/10 bg-card/70 px-5 backdrop-blur sm:px-8">
            {c.faq.map(({ q, a }, i) => (
              <AccordionItem key={q} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </Reveal>
    </div>
  );
}

/** The client's gold artwork, pinned to the viewport while the page scrolls over it. */
function GoldBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <Image src="/cs2/background.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_70%_0%,rgba(244,196,48,0.2),transparent_70%),linear-gradient(to_bottom,rgba(13,10,3,0.5),rgba(13,10,3,0.15)_35%,rgba(13,10,3,0.55))]" />
      </div>
    </div>
  );
}

const savedShare = (p: ProductCard) =>
  p.officialPriceMinor && p.officialPriceMinor > p.priceMinor ? (p.officialPriceMinor - p.priceMinor) / p.officialPriceMinor : 0;

async function Offers() {
  const { locale, dict, href } = await getI18n();
  const c = dict.cs2;
  const [{ items }, groups] = await Promise.all([
    getProducts({ locale, category: CS2_CATEGORY, sort: "featured", limit: 60 }),
    getSubcategories(CS2_CATEGORY, locale),
  ]);
  // The special offer of the week is the in-stock skin with the biggest discount.
  const special = items
    .filter((p) => p.inStock)
    .reduce<ProductCard | null>((best, p) => (best && savedShare(best) >= savedShare(p) ? best : p), null);
  const percent = special ? Math.round(savedShare(special) * 100) : 0;

  return (
    <>
      {special && (
        <Reveal>
          <section className="container-page pb-16">
            <div
              data-reveal
              className="grid overflow-hidden rounded-3xl border border-primary/30 bg-card/75 shadow-2xl shadow-black/40 backdrop-blur lg:grid-cols-[1.2fr_1fr]"
            >
              <Link
                href={href(`/product/${special.slug}`)}
                aria-label={special.name}
                className="relative aspect-[16/10] bg-[radial-gradient(65%_65%_at_50%_50%,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_75%)]"
              >
                <ProductImage
                  src={special.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="object-contain p-6 drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)] sm:p-10"
                />
                {percent > 0 && (
                  <span className="absolute top-4 left-4 rounded-lg bg-red-500 px-2.5 py-1 text-sm font-bold text-white tabular-nums">
                    −{percent}%
                  </span>
                )}
              </Link>
              <div className="flex flex-col justify-center p-6 sm:p-10">
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                  <SparklesIcon className="size-4" /> {c.specialLabel}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{special.name}</h2>
                {special.subcategoryName && <p className="mt-1 text-sm text-muted-foreground">{special.subcategoryName}</p>}
                <Price minor={special.priceMinor} currency={special.currency} className="mt-6 block text-4xl font-bold text-primary" />
                <OfficialPrice
                  priceMinor={special.priceMinor}
                  officialPriceMinor={special.officialPriceMinor}
                  currency={special.currency}
                  size="lg"
                  label={c.marketPrice}
                  className="mt-2"
                />
                <div className="mt-8 flex items-center gap-3">
                  <Button asChild size="lg" className="h-12 flex-1 rounded-xl font-semibold sm:flex-none sm:px-8">
                    <Link href={href(`/product/${special.slug}`)}>
                      {c.specialCta} <ArrowRightIcon />
                    </Link>
                  </Button>
                  <AddToCartButton productId={special.id} productName={special.name} variant="icon" className="size-12" />
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      <section id="ponude" className="container-page scroll-mt-24 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.offersTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.offersText}</p>
        </div>
        <Cs2Offers items={items} groups={groups} />
      </section>
    </>
  );
}

function OffersSkeleton() {
  return (
    <section className="container-page pb-16">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
