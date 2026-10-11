import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";
import { requireUserId } from "@/lib/auth";
import { AccountSettings } from "./account-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.title, robots: { index: false } };
}

export default async function AccountPage() {
  const { dict, href } = await getI18n();
  return (
    <div className="pt-[4.5rem]">
      <div aria-hidden className="bg-hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <div className="container-page max-w-3xl py-12 pb-28">
        <Link href={href("/profile")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" /> {dict.account.back}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{dict.account.title}</h1>
        <Suspense fallback={<Skeleton className="mt-8 h-[28rem] rounded-3xl" />}>
          <Guard />
        </Suspense>
      </div>
    </div>
  );
}

async function Guard() {
  await requireUserId();
  return <AccountSettings />;
}
