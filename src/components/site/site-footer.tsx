import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { SOCIAL_LINKS } from "@/lib/site";
import { FooterWordmark } from "./footer-wordmark";
import { Logo } from "./logo";
import { SocialIcon } from "./social-icon";

export async function SiteFooter() {
  const { dict, href } = await getI18n();
  const columns = [
    {
      title: dict.footer.shop,
      links: [
        { href: href("/marketplace"), label: dict.footer.allProducts },
        { href: href("/marketplace?category=fortnite"), label: "Fortnite" },
        { href: href("/marketplace?category=roblox"), label: "Roblox" },
        { href: href("/marketplace?category=valorant"), label: "Valorant" },
        { href: href("/marketplace?category=steam"), label: "Steam" },
      ],
    },
    {
      title: dict.footer.company,
      links: [
        { href: href("/"), label: dict.nav.home },
        { href: href("/about"), label: dict.nav.about },
        { href: href("/contact"), label: dict.nav.contact },
        { href: href("/profile"), label: dict.footer.myOrders },
      ],
    },
    {
      title: dict.footer.legal,
      links: [
        { href: href("/terms"), label: dict.footer.terms },
        { href: href("/privacy"), label: dict.footer.privacy },
        { href: href("/refund-policy"), label: dict.footer.refunds },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/[0.05] bg-ink">
      <div className="container-page grid gap-12 pt-16 pb-10 md:grid-cols-[1fr_auto]">
        <div className="max-w-sm space-y-6">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">{dict.footer.tagline}</p>
          {SOCIAL_LINKS.length > 0 && (
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <SocialIcon name={s.label} className="size-5" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-10 sm:grid-cols-3 lg:gap-x-16">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <FooterWordmark />

      <div className="container-page relative flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>© Gaminfy. {dict.footer.rights}</p>
        <p>{dict.footer.trademarks}</p>
      </div>
    </footer>
  );
}
