import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LEGAL_DOCS, type LegalKind } from "@/content/legal";
import { t } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { LEGAL } from "@/lib/site";

const LINKS: { kind: LegalKind; path: string }[] = [
  { kind: "terms", path: "/terms" },
  { kind: "privacy", path: "/privacy" },
  { kind: "refunds", path: "/refund-policy" },
];

export async function LegalDocument({ kind }: { kind: LegalKind }) {
  const { locale, dict, href } = await getI18n();
  const doc = LEGAL_DOCS[locale][kind];
  const fill = (text: string) =>
    t(text, {
      company: LEGAL.company,
      country: LEGAL.country[locale],
      email: LEGAL.email || dict.legal.contactForm,
    });
  const label = { terms: dict.footer.terms, privacy: dict.footer.privacy, refunds: dict.footer.refunds };

  return (
    <>
      <header className="relative isolate overflow-hidden pt-[4.5rem]">
        <div aria-hidden className="bg-hero-glow absolute inset-0 -z-10" />
        <div className="container-page pt-14 pb-12 sm:pt-20">
          <nav aria-label={dict.footer.legal} className="flex flex-wrap gap-2">
            {LINKS.map((l) => (
              <Link
                key={l.kind}
                href={href(l.path)}
                aria-current={l.kind === kind ? "page" : undefined}
                className={
                  l.kind === kind
                    ? "rounded-full bg-primary/15 px-3.5 py-1.5 text-xs font-semibold text-primary"
                    : "rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {label[l.kind]}
              </Link>
            ))}
          </nav>
          <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">{doc.title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {t(dict.legal.updated, { date: formatDate(new Date(doc.updated), locale) })}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg">{fill(doc.intro)}</p>
        </div>
      </header>

      <div className="container-page grid gap-12 border-t border-white/[0.06] pt-12 pb-28 lg:grid-cols-[15rem_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{dict.legal.toc}</p>
          <ol className="mt-4 space-y-2.5 text-sm">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground transition-colors hover:text-primary">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article className="max-w-3xl space-y-12">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p.slice(0, 32)} className="mt-4 leading-relaxed text-muted-foreground">
                  {fill(p)}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-3">
                  {s.list.map((item) => (
                    <li key={item.slice(0, 32)} className="flex gap-3 leading-relaxed text-muted-foreground">
                      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{fill(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-card p-6">
            <p className="font-medium">{dict.legal.questions}</p>
            <Button asChild className="rounded-full px-5">
              <Link href={href("/contact")}>
                {dict.legal.contactUs} <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </>
  );
}

export async function legalMetadata(kind: LegalKind) {
  const { locale } = await getI18n();
  const doc = LEGAL_DOCS[locale][kind];
  const path = LINKS.find((l) => l.kind === kind)!.path;
  return pageMetadata({ title: doc.title, description: doc.intro, path });
}
