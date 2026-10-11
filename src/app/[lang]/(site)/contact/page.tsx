import type { Metadata } from "next";
import Image from "next/image";
import { ClockIcon, GlobeIcon, ReceiptTextIcon, ShieldCheckIcon } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SocialIcon } from "@/components/site/social-icon";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getI18n } from "@/i18n/server";
import { pageMetadata } from "@/lib/seo";
import { SOCIAL_LINKS } from "@/lib/site";
import { JsonLd } from "@/components/site/json-ld";
import { ContactForm } from "./contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return pageMetadata({ title: dict.contact.title, description: dict.contact.metaDescription, path: "/contact" });
}

const INFO_ICONS = [ClockIcon, ReceiptTextIcon, GlobeIcon];

export default async function ContactPage() {
  const { dict } = await getI18n();
  const c = dict.contact;
  const half = Math.ceil(c.faq.length / 2);
  const faqColumns = [c.faq.slice(0, half), c.faq.slice(half)];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: c.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
        }}
      />
      <section className="relative isolate overflow-hidden pt-[4.5rem]">
        <div aria-hidden className="bg-hero-glow absolute inset-0 -z-10" />
        <div className="container-page pt-16 pb-14 text-center sm:pt-24">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{c.eyebrow}</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-bold tracking-tight">
            {c.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{c.description}</p>

          <ul className="mx-auto mt-12 grid max-w-4xl gap-6 text-left sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
            {c.info.map(({ title, text }, i) => {
              const Icon = INFO_ICONS[i];
              return (
                <li key={title} className="flex items-start gap-3 sm:justify-center sm:px-6">
                  <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span>
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container-page pb-24">
        <div className="rounded-[2rem] bg-gradient-to-br from-primary/50 via-white/[0.07] to-white/[0.03] p-px shadow-[0_50px_100px_-50px_rgba(46,227,138,0.25)]">
          <div className="grid overflow-hidden rounded-[calc(2rem-1px)] bg-card lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="relative isolate flex min-h-72 flex-col justify-end p-8 sm:p-10">
              <Image src="/promo/heroes-battle.webp" alt="" fill sizes="(min-width: 1024px) 520px, 100vw" className="-z-20 object-cover object-[25%_center]" />
              <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-card via-card/75 to-card/20" />
              <ShieldCheckIcon className="size-7 text-primary" />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">{c.panelTitle}</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{c.panelText}</p>
              {SOCIAL_LINKS.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/40 px-3 py-1.5 text-sm backdrop-blur hover:text-primary"
                    >
                      <SocialIcon name={s.label} className="size-4" /> {s.label}
                    </a>
                  ))}
                </div>
              )}
            </aside>
            <div className="border-t border-white/[0.06] lg:border-t-0 lg:border-l">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="container-page pb-28">
          <h2 data-reveal className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
            {c.faqTitle}
          </h2>
          <div className="mt-12 grid gap-x-10 lg:grid-cols-2">
            {faqColumns.map((column, col) => (
              <Accordion key={col} data-reveal type="single" collapsible>
                {column.map(({ q, a }, i) => (
                  <AccordionItem key={q} value={`${col}-${i}`} className="border-white/10">
                    <AccordionTrigger className="py-6 text-left text-base font-semibold hover:no-underline">{q}</AccordionTrigger>
                    <AccordionContent className="pb-6 text-sm leading-relaxed text-muted-foreground">{a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ))}
          </div>
        </section>
      </Reveal>
    </>
  );
}
