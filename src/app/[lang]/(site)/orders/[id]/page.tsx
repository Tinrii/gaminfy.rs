import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, CheckIcon, KeyRoundIcon, Loader2Icon, MessageCircleIcon } from "lucide-react";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Price } from "@/components/shop/price";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { isAdmin, requireUserId } from "@/lib/auth";
import { CONTACT_FIELD_KEYS, formatDateTime, parseContactFields } from "@/lib/format";
import { getOrderDetail } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { CopyCode } from "./copy-code";
import { FulfillmentForm } from "./fulfillment-form";
import { PaymentPoller } from "./payment-poller";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.order.title, robots: { index: false } };
}

export default async function OrderPage({ params }: PageProps<"/[lang]/orders/[id]">) {
  const { dict, href } = await getI18n();
  return (
    <div className="container-page pt-[6.5rem] pb-28">
      <Link href={href("/profile")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> {dict.order.back}
      </Link>
      <Suspense fallback={<Skeleton className="mt-6 h-96 rounded-3xl" />}>
        <OrderView params={params} />
      </Suspense>
    </div>
  );
}

const DETAIL_FIELD = {
  discord: "discordUsername",
  email: "email",
  phone: "phone",
  instagram: "instagram",
} as const;

async function OrderView({ params }: Pick<PageProps<"/[lang]/orders/[id]">, "params">) {
  const userId = await requireUserId();
  const { locale, dict, href } = await getI18n();
  const o = dict.order;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const detail = await getOrderDetail(id, locale);
  // 404 rather than 403 so order IDs can't be probed.
  if (!detail || (detail.order.userId !== userId && !isAdmin(userId))) notFound();

  const { order, product, code, details } = detail;
  const manual = product.deliveryType === "manual";
  const needsDetails = manual && (order.status === "paid" || order.status === "processing");

  const steps = [
    { label: o.stepPlaced, done: true },
    { label: o.stepPaid, done: !!order.paidAt },
    ...(manual ? [{ label: o.stepDetails, done: !!details }] : []),
    { label: o.stepDelivered, done: order.status === "delivered" },
  ];

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/[0.06] bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t(o.number, { id: order.id })}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">{product.name}</h1>
            </div>
            <OrderStatusBadge status={order.status} label={dict.status[order.status]} />
          </div>

          {order.status === "pending" && <PaymentPoller />}

          <ol className="mt-8 grid gap-4 sm:grid-cols-4" aria-label={o.progress}>
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 sm:flex-col sm:items-start">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border",
                    s.done ? "border-primary bg-primary text-primary-foreground" : "border-white/15 text-muted-foreground",
                  )}
                >
                  {s.done ? <CheckIcon className="size-4" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <span className={cn("text-xs", s.done ? "font-semibold" : "text-muted-foreground")}>{s.label}</span>
              </li>
            ))}
          </ol>
        </section>

        {code && (
          <section className="rounded-3xl border border-primary/30 bg-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-semibold">
              <KeyRoundIcon className="size-5 text-primary" /> {o.yourCode}
            </h2>
            <CopyCode code={code} />
            {product.instructions && <p className="mt-4 text-sm text-muted-foreground">{product.instructions}</p>}
          </section>
        )}

        {!manual && order.status === "paid" && !code && (
          <section className="flex gap-3 rounded-3xl border border-white/[0.06] bg-card p-6">
            <Loader2Icon className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{o.preparing}</p>
          </section>
        )}

        {needsDetails && (
          <section className="rounded-3xl border border-white/[0.06] bg-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageCircleIcon className="size-5 text-primary" />
              {details ? o.yourDetails : o.howReach}
            </h2>
            {product.instructions && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.instructions}</p>}
            <FulfillmentForm
              orderId={order.id}
              highlight={parseContactFields(product.requiredContactFields)}
              initial={
                details && {
                  discordUsername: details.discordUsername,
                  email: details.email,
                  phone: details.phone,
                  instagram: details.instagram,
                  notes: details.notes,
                }
              }
            />
          </section>
        )}

        {manual && order.status === "delivered" && details && (
          <section className="rounded-3xl border border-white/[0.06] bg-card p-6 text-sm">
            <h2 className="font-semibold">{o.sharedDetails}</h2>
            <dl className="mt-3 grid gap-2 text-muted-foreground">
              {CONTACT_FIELD_KEYS.map((k) => {
                const v = details[DETAIL_FIELD[k]];
                return v ? (
                  <div key={k} className="flex gap-2">
                    <dt className="w-48">{dict.contactFields[k].label}</dt>
                    <dd className="text-foreground">{v}</dd>
                  </div>
                ) : null;
              })}
            </dl>
          </section>
        )}
      </div>

      <aside className="h-fit space-y-3 rounded-3xl border border-white/[0.06] bg-card p-6 text-sm">
        <Row label={o.product}>
          <Link href={href(`/product/${product.slug}`)} className="hover:text-primary">
            {product.name}
          </Link>
        </Row>
        <Row label={o.total}>
          <Price minor={order.amountMinor} currency={order.currency} className="font-semibold text-primary" />
        </Row>
        <Row label={o.placed}>{formatDateTime(order.createdAt, locale)}</Row>
        {order.paidAt && <Row label={o.paid}>{formatDateTime(order.paidAt, locale)}</Row>}
        {order.deliveredAt && <Row label={o.delivered}>{formatDateTime(order.deliveredAt, locale)}</Row>}
        <Row label={o.delivery}>{manual ? o.byTeam : o.instantCode}</Row>
        <p className="border-t border-white/[0.06] pt-4 text-xs text-muted-foreground">
          {o.problem.split("{link}")[0]}
          <Link href={href("/contact")} className="text-primary hover:underline">
            {o.contactUs}
          </Link>
          {t(o.problem.split("{link}")[1] ?? "", { id: order.id })}
        </p>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
