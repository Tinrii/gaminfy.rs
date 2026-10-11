"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency, useI18n } from "@/i18n/client";
import {
  CURRENCIES,
  LOCALE_COOKIE,
  LOCALE_LABEL,
  LOCALES,
  localePath,
  stripLocale,
  type Currency,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

const CURRENCY_LABEL: Record<Currency, string> = { RSD: "RSD — dinar", EUR: "EUR — €", USD: "USD — $" };

function Trigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { locale } = useI18n();
  const { currency } = useCurrency();
  return (
    <Button
      {...props}
      variant="ghost"
      aria-label={`${locale.toUpperCase()} · ${currency}`}
      className={cn("h-9 gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground", className)}
    >
      <GlobeIcon className="size-4" />
      {locale.toUpperCase()} · {currency}
    </Button>
  );
}

/** Static button shown until the URL-aware switcher hydrates (it lives behind Suspense). */
export function LocaleSwitcherFallback({ className }: { className?: string }) {
  return <Trigger className={className} />;
}

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, dict } = useI18n();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const changeLocale = (next: string) => {
    const target = next as Locale;
    if (target === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
    router.push(`${localePath(target, stripLocale(pathname))}${search ? `?${search}` : ""}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Trigger className={className} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{dict.nav.language}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l}>
              {LOCALE_LABEL[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">{dict.nav.currency}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          {CURRENCIES.map((c) => (
            <DropdownMenuRadioItem key={c} value={c}>
              {CURRENCY_LABEL[c]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <p className="px-2 pt-2 pb-1 text-[0.7rem] leading-snug text-muted-foreground">{dict.nav.currencyNote}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
