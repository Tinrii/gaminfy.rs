"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductVariant } from "@/lib/db/schema";

export type VariantRow = {
  /** React key; saved rows use their id. */
  key: string;
  id: number | null;
  name: string;
  nameEn: string;
  price: string;
  officialPrice: string;
  stock: string;
};

export const toVariantRows = (variants: ProductVariant[]): VariantRow[] =>
  variants.map((v) => ({
    key: String(v.id),
    id: v.id,
    name: v.name,
    nameEn: v.nameEn ?? "",
    price: String(v.priceMinor / 100),
    officialPrice: v.officialPriceMinor != null ? String(v.officialPriceMinor / 100) : "",
    stock: v.manualStock != null ? String(v.manualStock) : "",
  }));

let nextKey = 0;
const emptyRow = (): VariantRow => ({
  key: `new-${++nextKey}`,
  id: null,
  name: "",
  nameEn: "",
  price: "",
  officialPrice: "",
  stock: "",
});

/**
 * Options a customer picks from on the product page (e.g. Standard / Ultimate), each with
 * its own price. Posted as parallel arrays (variantName, variantPrice, …) with the product form.
 */
export function VariantsEditor({
  rows,
  onChange,
  manual,
}: {
  rows: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
  /** Manual delivery: each option has its own stock. Automatic options count their codes instead. */
  manual: boolean;
}) {
  const set = (key: string, patch: Partial<VariantRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const cols = manual
    ? "md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_2.5rem]"
    : "md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]";

  return (
    <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
      <legend className="px-1 text-sm font-medium">Options</legend>
      <p className="text-xs text-muted-foreground">
        Optional — e.g. <span className="text-foreground">Standard</span> and{" "}
        <span className="text-foreground">Ultimate</span>. Customers pick one from a dropdown on the product page, and each
        option has its own price{manual ? " and stock" : " and its own codes (added below after saving)"}. Leave empty to
        sell the product as a single item.
      </p>

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className={`hidden gap-2 text-xs text-muted-foreground md:grid ${cols}`}>
            <span>Name — Serbian</span>
            <span>Name — English</span>
            <span>Price</span>
            <span>Official price</span>
            {manual && <span>Stock</span>}
            <span />
          </div>
          {rows.map((r, i) => (
            <div key={r.key} className={`grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] p-3 md:border-0 md:p-0 ${cols}`}>
              <input type="hidden" name="variantId" value={r.id ?? ""} />
              <Input
                name="variantName"
                value={r.name}
                onChange={(e) => set(r.key, { name: e.target.value })}
                placeholder="Standard"
                aria-label={`Option ${i + 1} name, Serbian`}
                required
                maxLength={120}
                className="col-span-2 h-10 rounded-xl md:col-span-1"
              />
              <Input
                name="variantNameEn"
                value={r.nameEn}
                onChange={(e) => set(r.key, { nameEn: e.target.value })}
                placeholder="Optional"
                aria-label={`Option ${i + 1} name, English`}
                maxLength={120}
                className="col-span-2 h-10 rounded-xl md:col-span-1"
              />
              <Input
                name="variantPrice"
                type="number"
                min={0}
                step="0.01"
                value={r.price}
                onChange={(e) => set(r.key, { price: e.target.value })}
                placeholder="Price"
                aria-label={`Option ${i + 1} price`}
                required
                className="h-10 rounded-xl"
              />
              <Input
                name="variantOfficialPrice"
                type="number"
                min={0}
                step="0.01"
                value={r.officialPrice}
                onChange={(e) => set(r.key, { officialPrice: e.target.value })}
                placeholder="Official"
                aria-label={`Option ${i + 1} official store price`}
                className="h-10 rounded-xl"
              />
              {manual ? (
                <Input
                  name="variantStock"
                  type="number"
                  min={0}
                  value={r.stock}
                  onChange={(e) => set(r.key, { stock: e.target.value })}
                  placeholder="∞"
                  aria-label={`Option ${i + 1} stock (empty for unlimited)`}
                  className="h-10 rounded-xl"
                />
              ) : (
                <input type="hidden" name="variantStock" value="" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
                aria-label={`Remove option ${r.name || i + 1}`}
                className="h-10 w-10 justify-self-end rounded-xl text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
          {manual && <p className="text-xs text-muted-foreground">Leave stock empty for unlimited.</p>}
        </div>
      )}

      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...rows, emptyRow()])} className="rounded-lg">
        <PlusIcon /> Add option
      </Button>
    </fieldset>
  );
}
