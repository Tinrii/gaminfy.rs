"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { HeroCarousel, type HeroCategory } from "./hero-carousel";

export function Hero({ categories }: { categories: HeroCategory[] }) {
  const { dict, href } = useI18n();
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-word]", { yPercent: 110, duration: 0.9, stagger: 0.06 })
          .from("[data-hero-fade]", { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.08 }, "-=0.5")
          .from("[data-hero-stage]", { autoAlpha: 0, y: 80, duration: 1.1, ease: "expo.out" }, "-=0.9");

        // The card fan drifts up slightly while scrolling past the hero.
        gsap.to("[data-hero-stage]", {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-hero-bg]", {
          yPercent: 18,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: ref },
  );

  const headline = dict.hero.headline;

  return (
    <section ref={ref} className="relative isolate overflow-hidden pt-[4.5rem]">
      <div data-hero-bg aria-hidden className="absolute inset-0 -z-10">
        <Image
          src="/promo/heroes-battle.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-[0.18] blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="bg-hero-glow absolute inset-0" />
      </div>

      <div className="container-page grid items-center gap-12 pt-10 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-28">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.6rem,6vw,4.25rem)] leading-[1.04] font-bold tracking-tight">
            {headline.map((line) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <span data-hero-word className="block">
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p data-hero-fade className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <form
            data-hero-fade
            action={href("/marketplace")}
            role="search"
            className="mt-8 flex max-w-md items-center gap-2 rounded-2xl border border-white/[0.08] bg-card/80 p-1.5 pl-4 backdrop-blur focus-within:border-primary/50"
          >
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <label htmlFor="hero-search" className="sr-only">
              {dict.hero.searchLabel}
            </label>
            <input
              id="hero-search"
              name="q"
              type="search"
              placeholder={dict.hero.searchPlaceholder}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button type="submit" className="h-10 rounded-xl px-5 font-semibold">
              {dict.hero.search}
            </Button>
          </form>

          <div data-hero-fade className="mt-6 flex items-center gap-5 text-sm">
            <Link
              href={href("/marketplace")}
              className="group inline-flex items-center gap-1.5 font-semibold text-primary"
            >
              {dict.hero.browse}
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div data-hero-stage>
          <HeroCarousel categories={categories} />
        </div>
      </div>
    </section>
  );
}
