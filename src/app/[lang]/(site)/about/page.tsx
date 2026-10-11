import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon, UserRoundCheckIcon, ZapIcon } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { Marquee } from "@/components/motion/marquee";
import { Reveal } from "@/components/motion/reveal";
import { ScrubText } from "@/components/motion/scrub-text";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { getCategories, getSiteStats } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { COUNTRIES } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AboutHero } from "./about-hero";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return pageMetadata({ title: dict.about.title, description: dict.about.metaDescription, path: "/about" });
}

// Draft copy based on the client's materials — final text to be approved by the Gaminfy team.
export default async function AboutPage() {
  const { locale, dict, href } = await getI18n();
  const [categories, stats] = await Promise.all([getCategories(locale), getSiteStats()]);
  const a = dict.about;

  const numbers = [
    { label: a.stats.games, value: <CountUp value={stats.categories} /> },
    { label: a.stats.products, value: <CountUp value={stats.products} /> },
    { label: a.stats.regions, value: <CountUp value={COUNTRIES.length} /> },
    { label: a.stats.delivery, value: <>&lt;1h</> },
  ];

  const delivery = [
    { icon: ZapIcon, title: a.automaticTitle, text: a.automaticText, flow: a.automaticFlow, games: "Steam · PlayStation · Valorant · GTA V" },
    { icon: UserRoundCheckIcon, title: a.manualTitle, text: a.manualText, flow: a.manualFlow, games: "Fortnite · Brawl Stars · Roblox · PUBG" },
  ];

  return (
    <>
      <AboutHero />

      <section aria-label={dict.marketplace.gamesLabel} className="border-y border-white/[0.05] py-5">
        <Marquee duration={50}>
          {categories.map((c) => (
            <Link key={c.id} href={href(`/marketplace?category=${c.slug}`)} className="group flex shrink-0 items-center gap-3 pr-6">
              <span className="relative size-9 overflow-hidden rounded-full ring-1 ring-white/10">
                <ProductImage src={c.thumbUrl ?? c.imageUrl} alt="" fill sizes="36px" className="object-cover" />
              </span>
              <span className="text-lg font-semibold whitespace-nowrap text-muted-foreground transition-colors group-hover:text-foreground">
                {c.name}
              </span>
              <span aria-hidden className="ml-3 text-primary/50">✦</span>
            </Link>
          ))}
        </Marquee>
      </section>

      <section className="container-page py-28 sm:py-36">
        <ScrubText
          text={a.manifesto}
          className="mx-auto max-w-4xl text-center text-[clamp(1.6rem,3.4vw,2.75rem)] leading-[1.25] font-semibold tracking-tight"
        />
      </section>

      <Reveal>
        <section className="container-page">
          <dl className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-4">
            {numbers.map((n, i) => (
              <div
                key={n.label}
                data-reveal
                className={cn(
                  "flex flex-col-reverse gap-2 border-white/10 py-8",
                  i < 2 && "border-b lg:border-b-0", // bottom divider only between the two mobile rows
                  i % 2 === 1 && "border-l pl-6 sm:pl-8", // middle divider on mobile
                  i === 2 && "lg:border-l lg:pl-8", // extra divider on the 4-column desktop row
                )}
              >
                <dt className="text-sm text-muted-foreground">{n.label}</dt>
                <dd className="text-5xl font-bold tracking-tight sm:text-6xl">{n.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page py-28">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{a.storyEyebrow}</p>
              <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">{a.storyTitle}</h2>
            </div>
          </div>
          <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            {a.story.map(({ title, text }, i) => (
              <li key={title} data-reveal className="border-t border-white/10 pt-6">
                <span className="text-outline block text-7xl leading-none font-extrabold italic">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page grid items-stretch gap-10 pb-28 lg:grid-cols-2 lg:gap-16">
          <div data-reveal className="relative min-h-80 overflow-hidden rounded-[2rem] lg:min-h-full">
            <Image src="/promo/heroes-battle.webp" alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover object-[30%_center]" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 text-xs font-semibold tracking-[0.2em] text-primary uppercase">{a.deliveryEyebrow}</p>
          </div>
          <div className="flex flex-col justify-center">
            <h2 data-reveal className="text-4xl font-bold tracking-tight sm:text-5xl">
              {a.deliveryTitle}
            </h2>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {delivery.map(({ icon: Icon, title, text, flow, games }) => (
                <article key={title} data-reveal className="py-8">
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-primary" />
                    <h3 className="text-xl font-semibold">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                    {flow.map((step, i) => (
                      <span key={step} className="flex items-center gap-2">
                        {step}
                        {i < flow.length - 1 && <span className="text-primary">→</span>}
                      </span>
                    ))}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{games}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page pb-28">
          <div data-reveal className="flex flex-col items-start justify-between gap-8 border-t border-white/10 pt-12 md:flex-row md:items-end">
            <div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">{a.ctaTitle}</h2>
              <p className="mt-4 max-w-md text-muted-foreground">{a.ctaText}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full px-7 font-semibold">
                <Link href={href("/marketplace")}>
                  {a.visitShop} <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-5">
                <Link href={href("/contact")}>
                  {a.contactUs} <ArrowUpRightIcon />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
