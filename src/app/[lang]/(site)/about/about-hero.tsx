"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowDownIcon, ArrowRightIcon } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function AboutHero() {
  const { dict, href } = useI18n();
  const a = dict.about;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-art]", { scale: 1.12, autoAlpha: 0, duration: 1.6, ease: "power2.out" })
          .from("[data-line]", { autoAlpha: 0, y: 48, duration: 0.9, stagger: 0.1 }, "-=1.1")
          .from("[data-fade]", { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.08 }, "-=0.5");

        gsap.to("[data-art]", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative isolate flex min-h-[min(92svh,60rem)] items-end overflow-hidden">
      <div data-art aria-hidden className="absolute inset-0 -z-20">
        <Image src="/promo/heroes-squad.webp" alt="" fill priority sizes="100vw" className="object-cover object-[center_20%]" />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/10" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

      <div className="container-page pt-40 pb-16 sm:pb-24">
        <h1 className="mt-5 max-w-4xl text-[clamp(2.75rem,7vw,6rem)] leading-[0.98] font-bold tracking-tight">
          {a.headline.map((line, i) => (
            <span key={line} data-line className={i === a.headline.length - 1 ? "block text-primary" : "block"}>
              {line}
            </span>
          ))}
        </h1>
        <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <p data-fade className="max-w-md text-base leading-relaxed text-foreground/75 sm:text-lg">
            {a.intro}
          </p>
          <div data-fade className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-7 font-semibold">
              <Link href={href("/marketplace")}>
                {a.visitShop} <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/25 bg-background/30 px-7 backdrop-blur">
              <Link href={href("/contact")}>{a.contactUs}</Link>
            </Button>
          </div>
        </div>
        <ArrowDownIcon data-fade aria-hidden className="mt-14 size-5 animate-bounce text-muted-foreground" />
      </div>
    </section>
  );
}
