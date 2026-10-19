import Link from "next/link";
import { ArrowRightIcon, Gamepad2Icon, HeadsetIcon, QuoteIcon, ShieldCheckIcon, StarIcon, ZapIcon } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { CategoryCard } from "@/components/shop/category-card";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS, type Testimonial } from "@/content/testimonials";
import type { Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getCategories, getSiteStats } from "@/lib/catalog";
import { Hero } from "./_home/hero";
import { TestimonialsCarousel } from "./_home/testimonials-carousel";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return pageMetadata({ description: dict.meta.description, path: "/" });
}

const FEATURE_ICONS = [ZapIcon, ShieldCheckIcon, Gamepad2Icon, HeadsetIcon];

export default async function HomePage() {
  const { locale, dict, href } = await getI18n();
  const [categories, stats] = await Promise.all([getCategories(locale), getSiteStats()]);

  return (
    <>
      <Hero
        categories={categories.map((c) => ({ slug: c.slug, name: c.name, imageUrl: c.imageUrl }))}
        searchCategories={categories.map((c) => ({ slug: c.slug, name: c.name, imageUrl: c.thumbUrl ?? c.imageUrl, offers: c.offers }))}
      />

      <Reveal>
        <section className="container-page -mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.features.map(({ title, text }, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div
                key={title}
                data-reveal
                className="group rounded-2xl border border-white/[0.06] bg-card/70 p-5 backdrop-blur transition-colors hover:border-primary/30"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-sm font-semibold">{title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            );
          })}
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page py-28" aria-labelledby="offer-heading">
          <div data-reveal className="mx-auto max-w-md text-center">
            <h2 id="offer-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.home.offerTitle}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{dict.home.offerSubtitle}</p>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {categories.slice(0, 10).map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
          <div data-reveal className="mt-12 flex justify-center">
            <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-6">
              <Link href={href("/marketplace")}>
                {dict.home.seeAll} <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative isolate py-20" aria-label={dict.home.statsLabel}>
          <div
            aria-hidden
            className="absolute inset-x-0 top-1/2 -z-10 mx-auto h-64 max-w-3xl -translate-y-1/2 rounded-full bg-primary/15 blur-[110px]"
          />
          <dl className="container-page grid grid-cols-2 gap-y-12 text-center lg:grid-cols-4">
            <Stat label={dict.about.stats.yearsWithYou} value={<CountUp value={dict.about.stats.years} />} />
            <Stat label={dict.home.statGames} value={<CountUp value={stats.categories} />} />
            <Stat label={dict.home.statCustomers} value={<CountUp value="40.000+" />} />
            <Stat label={dict.home.statDelivery} value={<span>0/24</span>} />
          </dl>
        </section>
      </Reveal>

      <Reveal>
        <section className="container-page pt-8 pb-28">
          <div
            data-reveal
            className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-card p-8 sm:p-12"
          >
            <div aria-hidden className="bg-hero-glow absolute inset-0 opacity-70" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{dict.home.howTitle}</h2>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground">{dict.home.howSubtitle}</p>
                <Button asChild size="lg" className="mt-7 h-11 rounded-xl px-6 font-semibold">
                  <Link href={href("/marketplace")}>
                    {dict.home.startShopping} <ArrowRightIcon />
                  </Link>
                </Button>
              </div>
              <ol className="grid gap-4 sm:grid-cols-3">
                {dict.home.steps.map(({ title, text }, i) => (
                  <li key={title} className="rounded-2xl border border-white/[0.06] bg-background/60 p-5">
                    <span className="text-xs font-semibold text-primary">0{i + 1}</span>
                    <p className="mt-3 text-sm font-semibold">{title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="pb-28" aria-labelledby="testimonials-heading">
        <Reveal>
          <div data-reveal className="container-page mx-auto max-w-md text-center">
            <h2 id="testimonials-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dict.home.testimonialsTitle}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{dict.home.testimonialsSubtitle}</p>
          </div>
        </Reveal>
        <div className="container-page mt-12">
          <TestimonialsCarousel>
            {TESTIMONIALS.map((item) => (
              <TestimonialCard key={item.name} item={item} locale={locale} ratingLabel={dict.home.ratingLabel} />
            ))}
          </TestimonialsCarousel>
        </div>
      </section>
    </>
  );
}

function TestimonialCard({ item, locale, ratingLabel }: { item: Testimonial; locale: Locale; ratingLabel: string }) {
  const initials = item.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <figure className="relative flex h-full flex-col rounded-2xl border border-white/[0.06] bg-card p-5">
      <QuoteIcon aria-hidden className="absolute top-5 right-5 size-6 text-primary/20" />
      <div className="flex gap-0.5" role="img" aria-label={ratingLabel.replace("{n}", String(item.rating))}>
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon
            key={i}
            aria-hidden
            className={i < item.rating ? "size-4 fill-gold text-gold" : "size-4 text-muted-foreground/30"}
          />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">“{item.quote[locale]}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </span>
        <span>
          <span className="block text-sm font-semibold">{item.name}</span>
          <span className="block text-xs text-muted-foreground">{item.product}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div data-reveal className="flex flex-col-reverse gap-2">
      <dt className="text-xs font-medium text-primary sm:text-sm">{label}</dt>
      <dd className="text-4xl font-semibold tracking-tight sm:text-5xl">{value}</dd>
    </div>
  );
}
