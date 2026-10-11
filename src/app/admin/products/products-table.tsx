"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2Icon, PencilIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProductRow } from "@/lib/admin-data";
import { cn } from "@/lib/utils";
import { addCodes, toggleProductActive, updateProductPrice, type AdminState } from "../actions";
import { SubmitButton } from "../ui";

const selectClass = "h-10 rounded-xl border border-input bg-background px-3 text-sm";

export function ProductsTable({
  rows,
  categories,
  initialStock,
  initialCategory,
}: {
  rows: AdminProductRow[];
  categories: { id: number; name: string }[];
  initialStock: "all" | "low";
  initialCategory: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [delivery, setDelivery] = useState("all");
  const [stock, setStock] = useState<"all" | "low">(initialStock);
  const [keysFor, setKeysFor] = useState<AdminProductRow | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (term && !`${r.name} ${r.nameEn ?? ""} ${r.categoryName}`.toLowerCase().includes(term)) return false;
      if (category !== "all" && String(r.categoryId) !== category) return false;
      if (delivery !== "all" && r.deliveryType !== delivery) return false;
      if (stock === "low") {
        const left = r.deliveryType === "automatic" ? r.codes : r.manualStock;
        if (left === null || left > 3) return false;
      }
      return true;
    });
  }, [rows, q, category, delivery, stock]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search products</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="h-10 rounded-xl pl-9" />
        </label>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Delivery type" value={delivery} onChange={(e) => setDelivery(e.target.value)} className={selectClass}>
          <option value="all">All delivery types</option>
          <option value="automatic">Automatic codes</option>
          <option value="manual">Manual</option>
        </select>
        <select aria-label="Stock" value={stock} onChange={(e) => setStock(e.target.value as "all" | "low")} className={selectClass}>
          <option value="all">Any stock</option>
          <option value="low">Low / out of stock</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-xs text-muted-foreground">
              <th className="py-3 pr-3 pl-4 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Delivery</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">Price (RSD)</th>
              <th className="py-3 pr-4 pl-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((r) => (
              <Row key={r.id} row={r} onAddKeys={() => setKeysFor(r)} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No products match.</p>}
      </div>

      <AddKeysDialog product={keysFor} onClose={() => setKeysFor(null)} />
    </div>
  );
}

function Row({ row, onAddKeys }: { row: AdminProductRow; onAddKeys: () => void }) {
  const automatic = row.deliveryType === "automatic";
  const left = automatic ? row.codes : row.manualStock;

  return (
    <tr className={cn("transition-colors hover:bg-white/[0.015]", !row.isActive && "opacity-55")}>
      <td className="py-3 pr-3 pl-4">
        <div className="flex items-center gap-3">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
            <ProductImage src={row.imageUrl} alt="" fill sizes="40px" className="object-cover object-top" />
          </span>
          <span className="min-w-0">
            <Link href={`/admin/products/${row.id}`} className="block truncate font-medium hover:text-primary">
              {row.name}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              {row.categoryName}
              {row.nameEn && row.nameEn !== row.name ? ` · ${row.nameEn}` : ""}
            </span>
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            automatic ? "bg-primary/10 text-primary" : "bg-sky-400/10 text-sky-300",
          )}
        >
          {automatic ? "Codes" : "Manual"}
        </span>
      </td>
      <td className="px-3 py-3">
        {left === null ? (
          <span className="text-xs text-muted-foreground">Unlimited</span>
        ) : (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              left === 0 ? "bg-destructive/10 text-destructive" : left <= 3 ? "bg-gold/10 text-gold" : "bg-white/5",
            )}
          >
            {left}
            {automatic ? " keys" : ""}
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <PriceCell id={row.id} priceMinor={row.priceMinor} />
      </td>
      <td className="py-3 pr-4 pl-3">
        <div className="flex items-center justify-end gap-1.5">
          {automatic && (
            <Button type="button" variant="secondary" size="sm" className="h-8 rounded-lg" onClick={onAddKeys}>
              <KeyRoundIcon /> Add keys
            </Button>
          )}
          <form action={toggleProductActive}>
            <input type="hidden" name="id" value={row.id} />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="rounded-lg"
              aria-label={row.isActive ? "Hide from shop" : "Show in shop"}
              title={row.isActive ? "Visible — click to hide" : "Hidden — click to show"}
            >
              {row.isActive ? <EyeIcon /> : <EyeOffIcon />}
            </Button>
          </form>
          <Button asChild variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Edit product" title="Edit">
            <Link href={`/admin/products/${row.id}`}>
              <PencilIcon />
            </Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}

function PriceCell({ id, priceMinor }: { id: number; priceMinor: number }) {
  const initial = String(priceMinor / 100);
  const [value, setValue] = useState(initial);
  const [state, action, pending] = useActionState<AdminState, FormData>(updateProductPrice, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  const dirty = value !== initial;
  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <Input
        name="price"
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Price in RSD"
        className="h-8 w-28 rounded-lg tabular-nums"
      />
      <Button
        type="submit"
        size="icon-sm"
        variant={dirty ? "default" : "ghost"}
        disabled={!dirty || pending}
        aria-label="Save price"
        className={cn("rounded-lg", !dirty && "invisible")}
      >
        {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
      </Button>
    </form>
  );
}

function AddKeysDialog({ product, onClose }: { product: AdminProductRow | null; onClose: () => void }) {
  const [state, action] = useActionState<AdminState, FormData>(addCodes, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok) {
      toast.success(state.message ?? "Keys added.");
      onClose();
    }
    // onClose is stable enough for this one-shot effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add keys</DialogTitle>
          <DialogDescription>
            {product?.name} — paste one key per line. Duplicates are skipped; each key goes to exactly one order.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="productId" value={product?.id ?? ""} />
          <Textarea name="codes" rows={8} required autoFocus placeholder={"XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY"} className="rounded-xl font-mono text-sm" />
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <SubmitButton className="rounded-xl">Add keys</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
