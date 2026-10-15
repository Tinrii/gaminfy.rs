import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getProductAdmin, listCategoriesAdmin, listKnownImages, listSubcategoriesAdmin } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { uploadsEnabled } from "@/lib/storage";
import { formatDate } from "@/lib/format";
import { addCodes, deleteCode, deleteProduct } from "../../actions";
import { ActionForm, SubmitButton } from "../../ui";
import { ConfirmDelete } from "../confirm-delete";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" /> Products
      </Link>
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <EditProduct params={params} />
      </Suspense>
    </div>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  await requireAdmin();
  const id = Number((await params).id);
  const [data, cats, subs, images] = await Promise.all([
    Number.isInteger(id) ? getProductAdmin(id) : null,
    listCategoriesAdmin(),
    listSubcategoriesAdmin(),
    listKnownImages(),
  ]);
  if (!data) notFound();
  const { product, codes } = data;
  const available = codes.filter((c) => c.orderId === null);
  const used = codes.length - available.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/product/${product.slug}`} target="_blank">
              <ExternalLinkIcon /> View
            </Link>
          </Button>
          <ConfirmDelete
            action={deleteProduct}
            id={product.id}
            title={`Delete ${product.name}?`}
            description="Products that already have orders are hidden instead of deleted, so order history stays intact."
          >
            <Trash2Icon /> Delete
          </ConfirmDelete>
        </div>
      </div>

      <ProductForm product={product} categories={cats.map((c) => c.category)} subcategories={subs} images={images} uploadsEnabled={uploadsEnabled()} />

      {product.deliveryType === "automatic" && (
        <section id="codes" className="scroll-mt-24 space-y-5 rounded-2xl border border-white/[0.06] bg-card p-6">
          <div>
            <h2 className="font-semibold">Code stock</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {available.length} available · {used} assigned to orders. Each code is delivered to exactly one order.
            </p>
          </div>

          <ActionForm action={addCodes} className="space-y-3">
            <input type="hidden" name="productId" value={product.id} />
            <Label htmlFor="codes">Add codes (one per line)</Label>
            <Textarea id="codes" name="codes" rows={5} placeholder={"XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY"} className="rounded-xl font-mono text-sm" />
            <SubmitButton className="rounded-xl">Add codes</SubmitButton>
          </ActionForm>

          {codes.length > 0 && (
            <ul className="max-h-96 divide-y divide-white/[0.05] overflow-y-auto rounded-xl border border-white/[0.06]">
              {codes.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  {/* Masked: admins can see full codes on the order page once assigned. */}
                  <code className="min-w-0 flex-1 truncate font-mono text-xs">
                    {c.code.length > 6 ? `${c.code.slice(0, 4)}••••${c.code.slice(-2)}` : "••••"}
                  </code>
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                  {c.orderId ? (
                    <Link href={`/admin/orders/${c.orderId}`} className="w-24 text-right text-xs text-primary hover:underline">
                      Order #{c.orderId}
                    </Link>
                  ) : (
                    <form action={deleteCode} className="w-24 text-right">
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
