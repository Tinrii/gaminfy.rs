import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategoriesAdmin, listKnownImages, listSubcategoriesAdmin } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { uploadsEnabled } from "@/lib/storage";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Products
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">New product</h1>
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <NewProduct />
      </Suspense>
    </div>
  );
}

async function NewProduct() {
  await requireAdmin();
  const [cats, subs, images] = await Promise.all([listCategoriesAdmin(), listSubcategoriesAdmin(), listKnownImages()]);
  return <ProductForm categories={cats.map((c) => c.category)} subcategories={subs} images={images} uploadsEnabled={uploadsEnabled()} />;
}
