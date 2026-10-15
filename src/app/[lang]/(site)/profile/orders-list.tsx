"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, PackageIcon } from "lucide-react";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Price } from "@/components/shop/price";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/dictionaries";
import { formatDate } from "@/lib/format";
import type { UserOrder } from "@/lib/orders";
import { cn } from "@/lib/utils";

type Filter = "all" | "active" | "done";
const ACTIVE = new Set(["pending", "paid", "processing"]);

export function OrdersList({ orders }: { orders: UserOrder[] }) {
  const { locale, dict, href } = useI18n();
  const p = dict.profile;
  const [filter, setFilter] = useState<Filter>("all");

  const counts: Record<Filter, number> = {
    all: orders.length,
    active: orders.filter((o) => ACTIVE.has(o.status)).length,
    done: orders.filter((o) => !ACTIVE.has(o.status)).length,
  };
  const visible = orders.filter((o) =>
    filter === "all" ? true : filter === "active" ? ACTIVE.has(o.status) : !ACTIVE.has(o.status),
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{p.purchaseHistory}</h2>
        {orders.length > 0 && (
          <div role="tablist" aria-label={p.purchaseHistory} className="inline-flex rounded-xl border border-white/[0.06] bg-card p-1">
            {(Object.keys(counts) as Filter[]).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-sm transition-colors",
                  filter === f ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.filters[f]}
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{counts[f]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-white/10 px-6 py-20 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-card">
            <PackageIcon className="size-7 text-muted-foreground" />
          </span>
          <p className="mt-5 text-lg font-semibold">{p.noOrders}</p>
          <p className="mt-1 text-sm text-muted-foreground">{p.noOrdersText}</p>
          <Button asChild className="mt-7 h-11 rounded-xl px-6 font-semibold">
            <Link href={href("/marketplace")}>{p.browse}</Link>
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-white/10 p-12 text-center text-sm text-muted-foreground">
          {p.noOrdersFilter}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {visible.map((o) => (
            <li key={o.id}>
              <Link
                href={href(`/orders/${o.id}`)}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-card p-3 pr-5 transition-colors hover:border-white/15"
              >
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  <ProductImage src={o.imageUrl} alt="" fill sizes="64px" className="object-cover object-top" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{o.categoryName}</span>
                  <span className="block truncate font-semibold">
                    {o.productName}
                    {o.moreCount > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">+{o.moreCount}</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(p.orderLine, { id: o.id, date: formatDate(o.createdAt, locale) })}
                  </span>
                </span>
                <span className="hidden sm:block">
                  <OrderStatusBadge status={o.status} label={dict.status[o.status]} />
                </span>
                <span className="text-right">
                  <Price minor={o.amountMinor} currency={o.currency} className="block font-semibold" />
                  <span className="mt-1 block sm:hidden">
                    <OrderStatusBadge status={o.status} label={dict.status[o.status]} />
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
