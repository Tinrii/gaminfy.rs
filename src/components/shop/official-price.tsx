"use client";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Price } from "./price";

/** Percent saved vs the official store, or null when there's nothing to compare. */
export function savingsPercent(priceMinor: number, officialPriceMinor: number | null | undefined) {
  if (!officialPriceMinor || officialPriceMinor <= priceMinor) return null;
  return Math.round(((officialPriceMinor - priceMinor) / officialPriceMinor) * 100);
}

/**
 * Comparison shown under our price: the official in-game store price struck through,
 * plus how much is saved. Renders nothing unless the official price is higher.
 */
export function OfficialPrice({
  priceMinor,
  officialPriceMinor,
  currency,
  size = "sm",
  className,
}: {
  priceMinor: number;
  officialPriceMinor: number | null | undefined;
  currency: string;
  /** "sm" for product cards, "lg" for the product page. */
  size?: "sm" | "lg";
  className?: string;
}) {
  const { dict } = useI18n();
  const p = dict.product;
  const percent = savingsPercent(priceMinor, officialPriceMinor);
  if (percent === null || !officialPriceMinor) return null;

  if (size === "sm") {
    return (
      <span className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs", className)} title={p.officialPrice}>
        <span className="sr-only">{p.officialPrice}: </span>
        <Price minor={officialPriceMinor} currency={currency} className="text-muted-foreground line-through decoration-muted-foreground/70" />
        {percent > 0 && (
          <span className="rounded-md bg-emerald-400/10 px-1.5 py-px font-semibold text-emerald-400 tabular-nums">−{percent}%</span>
        )}
      </span>
    );
  }

  return (
    <div className={cn("space-y-1 text-sm", className)}>
      <p className="text-muted-foreground">
        {p.officialPrice}:{" "}
        <Price minor={officialPriceMinor} currency={currency} className="line-through decoration-muted-foreground/70" />
      </p>
      <p className="inline-flex flex-wrap items-center gap-2 font-medium text-emerald-400">
        <span>
          {p.youSave.split("{amount}")[0]}
          <Price minor={officialPriceMinor - priceMinor} currency={currency} className="font-semibold" />
          {p.youSave.split("{amount}")[1]}
        </span>
        {percent > 0 && <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums">−{percent}%</span>}
      </p>
    </div>
  );
}
