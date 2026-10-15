"use client";

import { useActionState, useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, PencilIcon, PlusIcon, TicketPercentIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Coupon } from "@/lib/db/schema";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteCoupon, saveCoupon, toggleCouponActive, type AdminState } from "../actions";
import { SubmitButton } from "../ui";

const valueLabel = (c: Pick<Coupon, "type" | "value">) => (c.type === "percent" ? `${c.value}%` : formatPrice(c.value));

function couponState(c: Coupon): { label: string; tone: string } {
  if (!c.isActive) return { label: "Off", tone: "text-muted-foreground" };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { label: "Expired", tone: "text-destructive" };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { label: "Used up", tone: "text-gold" };
  return { label: "Active", tone: "text-emerald-400" };
}

/** yyyy-mm-dd in local time, for <input type="date">. */
const dateInput = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  // undefined = closed, null = creating, Coupon = editing
  const [editing, setEditing] = useState<Coupon | null | undefined>(undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discount codes customers can enter in the cart — a fixed RSD amount or a percentage.
          </p>
        </div>
        <Button className="h-10 rounded-xl px-4" onClick={() => setEditing(null)}>
          <PlusIcon /> New coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-card px-6 py-16 text-center">
          <TicketPercentIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No coupons yet.</p>
          <Button variant="secondary" className="rounded-xl" onClick={() => setEditing(null)}>
            <PlusIcon /> Create the first one
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="hidden md:table-cell">Min. order</TableHead>
                <TableHead>Used</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => {
                const state = couponState(c);
                return (
                  <TableRow key={c.id} className={cn(!c.isActive && "opacity-60")}>
                    <TableCell className="pl-5 font-mono font-semibold tracking-wide">{c.code}</TableCell>
                    <TableCell className="font-semibold text-primary">{valueLabel(c)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.minSubtotalMinor ? formatPrice(c.minSubtotalMinor) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {c.usedCount}
                      <span className="text-muted-foreground"> / {c.maxUses ?? "∞"}</span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.expiresAt ? formatDate(c.expiresAt) : "Never"}
                    </TableCell>
                    <TableCell className={cn("text-xs font-semibold", state.tone)}>{state.label}</TableCell>
                    <TableCell className="pr-5">
                      <div className="flex justify-end gap-1">
                        <form action={toggleCouponActive}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-lg"
                            aria-label={c.isActive ? `Turn off ${c.code}` : `Turn on ${c.code}`}
                            title={c.isActive ? "Turn off" : "Turn on"}
                          >
                            {c.isActive ? <EyeIcon /> : <EyeOffIcon />}
                          </Button>
                        </form>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-lg"
                          onClick={() => setEditing(c)}
                          aria-label={`Edit ${c.code}`}
                          title="Edit"
                        >
                          <PencilIcon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CouponDialog
        key={editing === undefined ? "closed" : (editing?.id ?? "new")}
        open={editing !== undefined}
        coupon={editing ?? undefined}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}

function CouponDialog({ open, coupon, onClose }: { open: boolean; coupon?: Coupon; onClose: () => void }) {
  const [state, action] = useActionState<AdminState, FormData>(saveCoupon, {});
  const [type, setType] = useState<Coupon["type"]>(coupon?.type ?? "fixed");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const defaultValue = coupon ? (coupon.type === "fixed" ? coupon.value / 100 : coupon.value) : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{coupon ? `Edit ${coupon.code}` : "New coupon"}</DialogTitle>
          <DialogDescription>
            A fixed amount comes off the cart total in dinars; a percentage comes off the whole cart.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="grid content-start gap-4 sm:grid-cols-2">
          {coupon && <input type="hidden" name="id" value={coupon.id} />}
          <F label="Code" id="cp-code" hint="Letters, digits, - and _. Customers can type it in any case.">
            <Input
              id="cp-code"
              name="code"
              required
              minLength={3}
              maxLength={40}
              defaultValue={coupon?.code}
              placeholder="e.g. LETO10"
              autoComplete="off"
              className="h-10 rounded-xl font-mono uppercase placeholder:font-sans placeholder:normal-case"
            />
          </F>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Discount type</legend>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-input p-1">
              {(
                [
                  ["fixed", "Amount (RSD)"],
                  ["percent", "Percent (%)"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-1.5 text-center text-sm transition-colors",
                    type === value ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={type === value}
                    onChange={() => setType(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <F
            label={type === "fixed" ? "Amount off (RSD)" : "Percent off"}
            id="cp-value"
            hint={type === "fixed" ? "e.g. 100, 200 or 300" : "Whole number from 1 to 99"}
          >
            <div className="relative">
              <Input
                id="cp-value"
                name="value"
                type="number"
                required
                min={type === "fixed" ? 1 : 1}
                max={type === "percent" ? 99 : undefined}
                step={type === "percent" ? 1 : "any"}
                defaultValue={defaultValue}
                className="h-10 rounded-xl pr-12"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-muted-foreground">
                {type === "fixed" ? "RSD" : "%"}
              </span>
            </div>
          </F>

          <F label="Minimum order (RSD)" id="cp-min" hint="Optional — cart subtotal needed for the code to work">
            <Input
              id="cp-min"
              name="minSubtotal"
              type="number"
              min={0}
              step="any"
              defaultValue={coupon?.minSubtotalMinor != null ? coupon.minSubtotalMinor / 100 : ""}
              placeholder="No minimum"
              className="h-10 rounded-xl"
            />
          </F>

          <F label="Max uses" id="cp-max" hint={coupon ? `Used ${coupon.usedCount}× so far. Empty = unlimited.` : "Empty = unlimited"}>
            <Input
              id="cp-max"
              name="maxUses"
              type="number"
              min={1}
              step={1}
              defaultValue={coupon?.maxUses ?? ""}
              placeholder="Unlimited"
              className="h-10 rounded-xl"
            />
          </F>

          <F label="Expires on" id="cp-exp" hint="Optional — valid until the end of that day">
            <Input
              id="cp-exp"
              name="expiresOn"
              type="date"
              defaultValue={dateInput(coupon?.expiresAt ?? null)}
              className="h-10 rounded-xl"
            />
          </F>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="size-4 accent-primary" />
            Active — customers can use this code
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:col-span-2">
            <SubmitButton className="h-10 rounded-xl px-5">{coupon ? "Save changes" : "Create coupon"}</SubmitButton>
            <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        {coupon && (
          <form
            action={async (fd) => {
              await deleteCoupon(fd);
              toast.success(coupon.usedCount > 0 ? "Coupon turned off (it was used on orders)." : "Coupon deleted.");
              onClose();
            }}
            className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
          >
            <input type="hidden" name="id" value={coupon.id} />
            <p className="text-xs text-muted-foreground">
              {coupon.usedCount > 0
                ? "Used on orders, so it will be turned off instead of deleted."
                : "Permanently delete this coupon."}
            </p>
            <SubmitButton variant="destructive" className="h-9 shrink-0 rounded-lg">
              <Trash2Icon /> {coupon.usedCount > 0 ? "Turn off" : "Delete"}
            </SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function F({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
