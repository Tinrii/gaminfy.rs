import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { listCoupons } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { CouponsManager } from "./coupons-manager";

export const metadata: Metadata = { title: "Coupons" };

export default function CouponsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <Coupons />
    </Suspense>
  );
}

async function Coupons() {
  await requireAdmin();
  return <CouponsManager coupons={await listCoupons()} />;
}
