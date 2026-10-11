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

  const { order, product, user, code, details } = detail;
  const automatic = product.deliveryType === "automatic";
  const canAssign = automatic && !code && (order.status === "paid" || order.status === "processing");
  const freeCodes = canAssign ? await unassignedCodeCount(product.id) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Order #{order.id}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{product.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {automatic ? "Automatic code delivery" : "Manual fulfillment"} ·{" "}
                <Link href={`/admin/products/${product.id}`} className="text-primary hover:underline">
                  edit product
                </Link>
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Customer">
              {user.displayName ? `${user.displayName} · ` : ""}
              <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                {user.email}
              </a>
            </Info>
            <Info label="Total">{formatPrice(order.amountMinor, order.currency)}</Info>
            <Info label="Placed">{formatDateTime(order.createdAt)}</Info>
            <Info label="Paid">{order.paidAt ? formatDateTime(order.paidAt) : "—"}</Info>
            <Info label="Delivered">{order.deliveredAt ? formatDateTime(order.deliveredAt) : "—"}</Info>
            <Info label="Stripe payment">
              <span className="font-mono text-xs break-all">{order.stripePaymentIntentId ?? "—"}</span>
            </Info>
          </dl>
        </section>

        {automatic && (
          <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
            <h2 className="font-semibold">Delivery code</h2>
            {code ? (
              <p className="mt-3 rounded-xl bg-background/60 p-3 font-mono text-sm break-all">{code}</p>
            ) : canAssign ? (
              <ActionForm action={assignCodeToOrder} className="mt-3 flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={order.id} />
                <p className="text-sm text-muted-foreground">
                  No code assigned yet — {freeCodes} available for this product.
                </p>
                <SubmitButton className="rounded-xl">Assign code & email customer</SubmitButton>
              </ActionForm>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No code assigned.</p>
            )}
          </section>
        )}

        {!automatic && (
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
