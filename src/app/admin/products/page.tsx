import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategoriesAdmin, listProductsAdmin } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { ProductsTable } from "./products-table";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Edit prices inline, add keys, hide or open a product for full editing.</p>
        </div>
        <Button asChild className="h-10 rounded-xl px-4">
          <Link href="/admin/products/new">
            <PlusIcon /> New product
          </Link>
        </Button>
      </div>
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <Products searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Products({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  await requireAdmin();
  const [rows, cats, sp] = await Promise.all([listProductsAdmin(), listCategoriesAdmin(), searchParams]);
  return (
    <ProductsTable
      rows={rows}
      categories={cats.map(({ category }) => ({ id: category.id, name: category.name }))}
      initialStock={sp.stock === "low" ? "low" : "all"}
      initialCategory={typeof sp.category === "string" ? sp.category : "all"}
    />
  );
}
