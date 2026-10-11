import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listOrders } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/db/schema";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

const FILTERS: { value?: OrderStatus | "action"; label: string }[] = [
  { label: "All" },
  { value: "action", label: "Need action" },
  { value: "pending", label: "Awaiting payment" },
  { value: "processing", label: "Processing" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const raw = (await searchParams).status;
  const status = FILTERS.find((f) => f.value && f.value === raw)?.value;
  const orders = await listOrders({ status, limit: 300 });

  return (
    <>
      <nav className="scrollbar-none flex gap-2 overflow-x-auto" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium",
              status === f.value ? "border-primary/60 bg-primary/10 text-foreground" : "border-white/10 text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No orders here.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-5 text-right">Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-5">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-primary hover:underline">
                      #{o.id}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-56 truncate">
                    {o.productName}
                    <span className="ml-2 text-xs text-muted-foreground">{o.deliveryType === "manual" ? "manual" : "code"}</span>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">{o.customer}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      {o.deliveryType === "manual" && o.status === "paid" && !Number(o.hasDetails) && (
                        <span className="text-xs text-gold">awaiting details</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(o.amountMinor, o.currency)}</TableCell>
                  <TableCell className="pr-5 text-right text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
