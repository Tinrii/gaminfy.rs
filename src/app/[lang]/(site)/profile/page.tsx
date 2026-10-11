import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarIcon, PackageCheckIcon, ReceiptTextIcon, ShieldCheckIcon, UserCogIcon, WalletIcon } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { Price } from "@/components/shop/price";
import { LogoutButton } from "@/components/site/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/dictionaries";
import { getI18n } from "@/i18n/server";
import { isAdmin, requireUserId } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getUserOrders } from "@/lib/orders";
import { syncCurrentUser } from "@/lib/users";
import { OrdersList } from "./orders-list";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.profile.title, robots: { index: false } };
}

export default function ProfilePage() {
  return (
    <div className="container-page pt-[6rem] pb-28">
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile />
      </Suspense>
    </div>
  );
}

const PAID = new Set(["paid", "processing", "delivered"]);

async function Profile() {
  const userId = await requireUserId();
  const { locale, dict, href } = await getI18n();
  const user = await syncCurrentUser();
  if (!user) return null;
  const orders = await getUserOrders(userId, locale);
  const p = dict.profile;

  const name = user.displayName ?? user.username ?? user.email.split("@")[0];
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const spent = orders.filter((o) => PAID.has(o.status)).reduce((sum, o) => sum + o.amountMinor, 0);

  const actionClass =
    "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium backdrop-blur transition-colors";

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/[0.07]">
        <Image src="/promo/heroes-squad.webp" alt="" fill priority sizes="(min-width: 1216px) 1216px, 100vw" className="-z-20 object-cover object-[center_30%]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-card via-card/85 to-card/40" />

        <div className="flex flex-col gap-6 p-6 pt-24 sm:flex-row sm:items-end sm:p-8 sm:pt-32">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-[1.75rem] ring-4 ring-card sm:size-28">
            {user.imageUrl && <Image src={user.imageUrl} alt="" fill sizes="112px" className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="truncate">{user.email}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" /> {t(p.memberSince, { date: formatDate(user.createdAt, locale) })}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin(userId) && (
              <Link href="/admin" className={`${actionClass} border-gold/40 bg-gold/10 text-gold hover:bg-gold/20`}>
                <ShieldCheckIcon className="size-4" /> {p.adminPanel}
              </Link>
            )}
            <Link href={href("/profile/account")} className={`${actionClass} border-white/15 bg-white/[0.06] hover:bg-white/[0.12]`}>
              <UserCogIcon className="size-4" /> {p.accountSettings}
            </Link>
            <LogoutButton className={`${actionClass} border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20`} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ReceiptTextIcon, label: p.statOrders, value: <CountUp value={orders.length} /> },
          { icon: PackageCheckIcon, label: p.statDelivered, value: <CountUp value={delivered} /> },
          { icon: WalletIcon, label: p.statSpent, value: <Price minor={spent} /> },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-card p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xl font-semibold tracking-tight">{value}</span>
              <span className="block text-xs text-muted-foreground">{label}</span>
            </span>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <OrdersList orders={orders} />
      </section>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <Skeleton className="h-64 rounded-[2rem]" />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="mt-12 h-72 rounded-3xl" />
    </>
  );
}
