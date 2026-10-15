import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { unassignedCodeCount } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice, ORDER_STATUS_LABEL } from "@/lib/format";
import { getOrderDetail } from "@/lib/orders";
import { assignCodeToOrder, updateOrderStatus } from "../../actions";
import { ActionForm, SubmitButton } from "../../ui";

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Orders
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <AdminOrder params={params} />
      </Suspense>
    </div>
  );
}

async function AdminOrder({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  const detail = Number.isInteger(id) ? await getOrderDetail(id) : null;
  if (!detail) notFound();

  const { order, user, customerEmail, items, details } = detail;
  const hasManual = items.some((i) => i.deliveryType === "manual");
  const missing = items.filter((i) => i.deliveryType === "automatic" && i.codes.length < i.quantity);
  const canAssign = missing.length > 0 && (order.status === "paid" || order.status === "processing");
  const freeCodes = canAssign
    ? await Promise.all(missing.map(async (i) => ({ name: i.name, free: await unassignedCodeCount(i.productId) })))
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Order #{order.id}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {items.length === 1 ? items[0].name : `${items.length} products`}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasManual ? "Includes manual fulfillment" : "Automatic code delivery"}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Customer">
              {user?.displayName ? `${user.displayName} · ` : ""}
              <a href={`mailto:${customerEmail}`} className="text-primary hover:underline">
                {customerEmail}
              </a>
              {!user && <span className="ml-2 text-xs text-muted-foreground">(guest)</span>}
            </Info>
            <Info label="Total">
              {formatPrice(order.amountMinor, order.currency)}
              {order.discountMinor > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatPrice(order.subtotalMinor, order.currency)} − {formatPrice(order.discountMinor, order.currency)}
                  {order.couponCode ? ` · ${order.couponCode}` : ""})
                </span>
              )}
            </Info>
            <Info label="Placed">{formatDateTime(order.createdAt)}</Info>
            <Info label="Paid">{order.paidAt ? formatDateTime(order.paidAt) : "—"}</Info>
            <Info label="Delivered">{order.deliveredAt ? formatDateTime(order.deliveredAt) : "—"}</Info>
            <Info label="Stripe payment">
              <span className="font-mono text-xs break-all">{order.stripePaymentIntentId ?? "—"}</span>
            </Info>
          </dl>
        </section>

        <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {items.map((item) => (
              <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <Link href={`/admin/products/${item.productId}`} className="font-medium hover:text-primary hover:underline">
                      {item.name}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.deliveryType === "manual" ? "manual" : "code"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.quantity} × {formatPrice(item.unitPriceMinor, order.currency)}
                  </span>
                </div>
                {item.deliveryType === "automatic" && (
                  <div className="mt-2 space-y-1.5">
                    {item.codes.map((code) => (
                      <p key={code} className="rounded-lg bg-background/60 px-3 py-2 font-mono text-sm break-all">
                        {code}
                      </p>
                    ))}
                    {item.codes.length < item.quantity && (
                      <p className="text-xs text-gold">
                        {item.quantity - item.codes.length} code{item.quantity - item.codes.length === 1 ? "" : "s"} not assigned yet
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {canAssign && (
            <ActionForm action={assignCodeToOrder} className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-5">
              <input type="hidden" name="id" value={order.id} />
              <p className="text-sm text-muted-foreground">
                Available now: {freeCodes.map((c) => `${c.name} (${c.free})`).join(", ")}
              </p>
              <SubmitButton className="rounded-xl">Assign missing codes</SubmitButton>
            </ActionForm>
          )}
        </section>

        {hasManual && (
          <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
            <h2 className="font-semibold">Customer contact details</h2>
            {details ? (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Discord">{details.discordUsername ?? "—"}</Info>
                <Info label="Email">{details.email ?? "—"}</Info>
                <Info label="Phone">{details.phone ?? "—"}</Info>
                <Info label="Instagram">{details.instagram ?? "—"}</Info>
                <div className="sm:col-span-2">
                  <Info label="Order details">
                    <span className="whitespace-pre-wrap">{details.notes ?? "—"}</span>
                  </Info>
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">Submitted {formatDateTime(details.updatedAt)}</p>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {order.status === "pending" ? "The customer hasn't paid yet." : "The customer hasn't submitted their details yet."}
              </p>
            )}
          </section>
        )}
      </div>

      <aside className="h-fit rounded-2xl border border-white/[0.06] bg-card p-6">
        <h2 className="font-semibold">Update status</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Marking as delivered emails the customer. Payment states come from Stripe.
        </p>
        <ActionForm action={updateOrderStatus} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <Label htmlFor="status" className="sr-only">
            Status
          </Label>
          <select
            id="status"
            name="status"
            defaultValue={order.status === "pending" ? "cancelled" : order.status}
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {(["paid", "processing", "delivered", "cancelled", "refunded"] as const).map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <SubmitButton className="h-10 w-full rounded-xl">Save status</SubmitButton>
        </ActionForm>
      </aside>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
