"use client";

import { useRef, useState } from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/i18n/client";
import type { ProductSort } from "@/lib/catalog";

/** Plain GET form: works without JS, and every filter state is a shareable URL. */
export function MarketplaceFilters(props: {
  category?: string;
  q?: string;
  min?: number;
  max?: number;
  sort?: ProductSort;
  inStock?: boolean;
}) {
  const { dict, href } = useI18n();
  const m = dict.marketplace;
  const form = useRef<HTMLFormElement>(null);
  const [sort, setSort] = useState<ProductSort>(props.sort ?? "featured");
  const submit = () => form.current?.requestSubmit();

  return (
    <form
      ref={form}
      action={href("/marketplace")}
      className="mt-6 grid gap-3 rounded-2xl border border-white/[0.06] bg-card/60 p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
    >
      {props.category && <input type="hidden" name="category" value={props.category} />}

      <label className="relative block">
        <span className="sr-only">{m.searchLabel}</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={props.q}
          placeholder={m.searchPlaceholder}
          className="h-10 rounded-xl pl-9"
        />
      </label>

      <fieldset className="flex items-center gap-2">
        <legend className="sr-only">{m.priceRange}</legend>
        <Input
          name="min"
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          defaultValue={props.min}
          placeholder={m.min}
          aria-label={m.minLabel}
          className="h-10 w-full rounded-xl md:w-28"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          name="max"
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          defaultValue={props.max}
          placeholder={m.max}
          aria-label={m.maxLabel}
          className="h-10 w-full rounded-xl md:w-28"
        />
      </fieldset>

      <div className="flex items-center gap-3">
        <Select
          name="sort"
          value={sort}
          onValueChange={(v) => {
            setSort(v as ProductSort);
            queueMicrotask(submit);
          }}
        >
          <SelectTrigger className="h-10! w-full rounded-xl md:w-48" aria-label={m.sortLabel}>
            <SelectValue>{m.sort[sort]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(m.sort).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            name="stock"
            value="1"
            defaultChecked={props.inStock}
            onChange={submit}
            className="size-4 accent-primary"
          />
          {m.inStock}
        </label>
      </div>

      <Button type="submit" className="h-10 rounded-xl px-5 font-semibold">
        <SlidersHorizontalIcon /> {m.apply}
      </Button>
    </form>
  );
}
