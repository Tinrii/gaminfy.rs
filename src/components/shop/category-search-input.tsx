"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { suggestProducts, type ProductSuggestion } from "@/app/actions/search";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export type SuggestCategory = { slug: string; name: string; imageUrl: string | null; offers?: number };

/** Case- and accent-insensitive, so "pokemon" finds "Pokémon". */
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const MAX_CATEGORIES = 4;
const DEBOUNCE_MS = 200;

type Option =
  | { kind: "category"; key: string; category: SuggestCategory }
  | { kind: "product"; key: string; product: ProductSuggestion };

/**
 * Search box (`name="q"`, submits with its form) that suggests matching games and
 * products while typing — games first. Picking one opens it right away.
 * The popup is positioned against the closest positioned ancestor; pass
 * `wrapperClassName` without `relative` to anchor it to a wider parent.
 */
export function CategorySearchInput({
  categories,
  id,
  placeholder,
  defaultValue,
  className,
  wrapperClassName = "relative",
}: {
  categories: SuggestCategory[];
  id: string;
  placeholder: string;
  defaultValue?: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const { locale, dict, href } = useI18n();
  const m = dict.marketplace;
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Product matches and the query they belong to, so stale results never show.
  const [products, setProducts] = useState<{ q: string; items: ProductSuggestion[] }>({ q: "", items: [] });
  const requestId = useRef(0);

  const q = fold(value);
  const raw = value.trim();

  // Games are matched instantly on the client.
  const categoryMatches = q
    ? categories
        .map((c) => ({ c, name: fold(c.name), slug: fold(c.slug) }))
        .filter((x) => x.name.includes(q) || x.slug.includes(q))
        .sort((a, b) => rank(a.name, q) - rank(b.name, q))
        .slice(0, MAX_CATEGORIES)
        .map((x) => x.c)
    : [];

  // Products come from the server, debounced while typing.
  useEffect(() => {
    if (!open || raw.length < 2) return;
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      suggestProducts({ q: raw, locale })
        .then((items) => id === requestId.current && setProducts({ q: raw, items }))
        .catch(() => id === requestId.current && setProducts({ q: raw, items: [] }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [raw, open, locale]);

  // The previous results stay up while the next ones load, so the list doesn't flicker.
  const productMatches = raw.length >= 2 ? products.items : [];
  const loadingProducts = raw.length >= 2 && products.q !== raw;

  const options: Option[] = [
    ...categoryMatches.map((c) => ({ kind: "category" as const, key: `c:${c.slug}`, category: c })),
    ...productMatches.map((p) => ({ kind: "product" as const, key: `p:${p.slug}`, product: p })),
  ];
  const showing = open && options.length > 0;

  const pick = (o: Option) => {
    setOpen(false);
    inputRef.current?.blur();
    router.push(
      href(o.kind === "category" ? `/marketplace?category=${encodeURIComponent(o.category.slug)}` : `/product/${o.product.slug}`),
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      // Cycles through the suggestions and back to the typed text (-1).
      setActive((i) => {
        const next = i + step;
        return next >= options.length ? -1 : next < -1 ? options.length - 1 : next;
      });
      return;
    }
    // Enter on a highlighted suggestion opens it; otherwise the form searches as usual.
    if (e.key === "Enter" && active >= 0 && active < options.length) {
      e.preventDefault();
      pick(options[active]);
    }
  };

  const row = (o: Option, i: number) => {
    const on = i === active;
    const image = o.kind === "category" ? o.category.imageUrl : o.product.imageUrl;
    return (
      <li
        key={o.key}
        id={`${listId}-${i}`}
        role="option"
        aria-selected={on}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={() => setActive(i)}
        onClick={() => pick(o)}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm",
          on ? "bg-white/[0.08] text-foreground" : "text-foreground/90",
        )}
      >
        <span
          className={cn(
            "relative size-9 shrink-0 overflow-hidden bg-white/[0.06]",
            o.kind === "category" ? "rounded-full" : "rounded-lg",
          )}
        >
          <ProductImage src={image} alt="" fill sizes="36px" className="object-cover object-top" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{o.kind === "category" ? o.category.name : o.product.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {o.kind === "category"
              ? o.category.offers !== undefined && plural(locale, o.category.offers, dict.category.offers)
              : o.product.categoryName}
          </span>
        </span>
        {o.kind === "product" ? (
          <Price minor={o.product.priceMinor} currency={o.product.currency} className="shrink-0 text-xs font-semibold text-primary" />
        ) : (
          <ArrowRightIcon className={cn("size-4 shrink-0 text-primary transition-opacity", on ? "opacity-100" : "opacity-0")} />
        )}
      </li>
    );
  };

  const heading = (label: string, spinner = false) => (
    <li
      role="presentation"
      className="flex items-center gap-2 px-3 pt-2 pb-1 text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
    >
      {label}
      {spinner && <Loader2Icon className="size-3 animate-spin" />}
    </li>
  );

  return (
    <div className={wrapperClassName}>
      <input
        ref={inputRef}
        id={id}
        name="q"
        type="search"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showing}
        aria-controls={listId}
        aria-activedescendant={showing && active >= 0 && active < options.length ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        // Delay so a click on a suggestion lands before the popup closes.
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {showing && (
        <ul
          id={listId}
          role="listbox"
          aria-label={m.searchLabel}
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-2xl border border-white/10 bg-popover/95 p-1.5 text-left shadow-2xl shadow-black/40 backdrop-blur"
        >
          {categoryMatches.length > 0 && heading(m.gamesLabel)}
          {options.filter((o) => o.kind === "category").map((o, i) => row(o, i))}
          {(productMatches.length > 0 || loadingProducts) && heading(m.productsLabel, loadingProducts)}
          {options.filter((o) => o.kind === "product").map((o, i) => row(o, categoryMatches.length + i))}
        </ul>
      )}
    </div>
  );
}

function rank(name: string, q: string) {
  if (name.startsWith(q)) return 0;
  if (name.split(" ").some((w) => w.startsWith(q))) return 1;
  return 2;
}
