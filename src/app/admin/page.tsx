import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, ChevronRightIcon, ClockIcon, KeyRoundIcon, MailIcon } from "lucide-react";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminOverview } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminHome() {
  return (
    <div className="flex h-full min-h-[34rem] flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <Suspense fallback={<Skeleton className="flex-1 rounded-2xl" />}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  await requireAdmin();
  const data = await getAdminOverview();

  const tiles = [
    { label: "Need action", value: data.needsAction, href: "/admin/orders?status=action", icon: AlertTriangleIcon, tone: "text-gold bg-gold/10" },
    { label: "Awaiting payment", value: data.unpaid, href: "/admin/orders?status=pending", icon: ClockIcon, tone: "text-muted-foreground bg-white/5" },
    { label: "Delivered", value: data.delivered, href: "/admin/orders?status=delivered", icon: CheckCircle2Icon, tone: "text-primary bg-primary/10" },
    { label: "Unread messages", value: data.unreadMessages, href: "/admin/messages", icon: MailIcon, tone: "text-sky-300 bg-sky-400/10" },
  ];

  return (
    <>
      <div className="grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, href, icon: Icon, tone }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-card p-5 transition-colors hover:border-white/15"
          >
            <span className={cn("grid size-11 place-items-center rounded-xl", tone)}>
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-2xl leading-none font-semibold tabular-nums">{value}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel
          title="Recent orders"
          action={
            <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
              All orders
            </Link>
          }
        >
          {data.recent.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {data.recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 text-sm hover:bg-white/[0.02] lg:grid-cols-[3.5rem_1fr_12rem_auto_6rem_8rem]"
                  >
                    <span className="text-muted-foreground">#{o.id}</span>
                    <span className="truncate font-medium">
                      {o.productName}
                      {o.moreCount > 0 && <span className="ml-1.5 text-xs font-normal text-muted-foreground">+{o.moreCount}</span>}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground lg:block">{o.customer}</span>
                    <OrderStatusBadge status={o.status} />
                    <span className="hidden text-right lg:block">{formatPrice(o.amountMinor, o.currency)}</span>
                    <span className="hidden text-right text-xs text-muted-foreground lg:block">{formatDateTime(o.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Low code stock"
          subtitle="Automatic products with 3 or fewer codes"
          action={
            <Link href="/admin/products?stock=low" className="text-xs font-medium text-primary hover:underline">
              Manage
            </Link>
          }
        >
          {data.lowStock.length === 0 ? (
            <Empty>All stocked up.</Empty>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}#codes`} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-white/[0.02]">
                    <KeyRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                        p.codes === 0 ? "bg-destructive/10 text-destructive" : "bg-gold/10 text-gold",
                      )}
                    >
                      {p.codes}
                    </span>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-72 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-card xl:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
