import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategoriesAdmin, listKnownImages, listSubcategoriesFull } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { uploadsEnabled } from "@/lib/storage";
import { CategoriesManager } from "./categories-manager";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      }
    >
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  await requireAdmin();
  const [rows, subcategories, images] = await Promise.all([listCategoriesAdmin(), listSubcategoriesFull(), listKnownImages()]);
  return (
    <CategoriesManager
      categories={rows.map(({ category, products }) => ({ ...category, products: Number(products) }))}
      subcategories={subcategories}
      images={images}
      uploadsEnabled={uploadsEnabled()}
    />
  );
}
