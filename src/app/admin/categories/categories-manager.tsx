"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { EyeOffIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminSubcategory } from "@/lib/admin-data";
import type { Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { deleteCategory, saveCategory, type AdminState } from "../actions";
import { ImageUploadField } from "../image-upload-field";
import { SubmitButton } from "../ui";
import { SubcategoriesEditor } from "./subcategories-editor";

type Row = Category & { products: number };

export function CategoriesManager({
  categories,
  subcategories,
  images,
  uploadsEnabled,
}: {
  categories: Row[];
  subcategories: AdminSubcategory[];
  images: string[];
  uploadsEnabled: boolean;
}) {
  // undefined = closed, null = creating, Row = editing
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length} games & services · order controls their position in the shop.
          </p>
        </div>
        <Button className="h-10 rounded-xl px-4" onClick={() => setEditing(null)}>
          <PlusIcon /> New category
        </Button>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {categories.map((c) => (
          <li key={c.id}>
            <article
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card transition-colors hover:border-white/15",
                !c.isActive && "opacity-60",
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                <ProductImage
                  src={c.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 22vw, 45vw"
                  className="object-cover brightness-90 transition-[filter] duration-300 group-hover:brightness-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <span className="absolute top-3 left-3 rounded-full bg-background/80 px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums backdrop-blur">
                  #{c.sortOrder}
                </span>
                {!c.isActive && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[0.65rem] font-semibold backdrop-blur">
                    <EyeOffIcon className="size-3" /> Hidden
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h2 className="truncate font-semibold">{c.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">/{c.slug}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-2.5">
                <Link
                  href={`/admin/products?category=${c.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {c.products} product{c.products === 1 ? "" : "s"}
                </Link>
                <Button size="sm" variant="secondary" className="h-8 rounded-lg" onClick={() => setEditing(c)}>
                  <PencilIcon /> Edit
                </Button>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <CategoryDialog
        key={editing === undefined ? "closed" : (editing?.id ?? "new")}
        open={editing !== undefined}
        category={editing ?? undefined}
        subcategories={editing ? subcategories.filter((s) => s.categoryId === editing.id) : []}
        images={images}
        uploadsEnabled={uploadsEnabled}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}

function CategoryDialog({
  open,
  category,
  subcategories,
  images,
  uploadsEnabled,
  onClose,
}: {
  open: boolean;
  category?: Row;
  subcategories: AdminSubcategory[];
  images: string[];
  uploadsEnabled: boolean;
  onClose: () => void;
}) {
  const [state, action] = useActionState<AdminState, FormData>(saveCategory, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{category ? `Edit ${category.name}` : "New category"}</DialogTitle>
          <DialogDescription>Cover art shows on the homepage; the square thumbnail in the shop’s game tabs.</DialogDescription>
        </DialogHeader>

        <form action={action} className="grid content-start gap-4 sm:grid-cols-2">
          {category && <input type="hidden" name="id" value={category.id} />}
          <F label="Name — Serbian" id="cat-name">
            <Input id="cat-name" name="name" required defaultValue={category?.name} className="h-10 rounded-xl" />
          </F>
          <F label="Name — English" id="cat-name-en">
            <Input
              id="cat-name-en"
              name="nameEn"
              defaultValue={category?.nameEn ?? ""}
              placeholder="Same as Serbian"
              className="h-10 rounded-xl"
            />
          </F>
          <F label="URL slug" id="cat-slug">
            <Input id="cat-slug" name="slug" defaultValue={category?.slug} placeholder="auto" className="h-10 rounded-xl" />
          </F>
          <F label="Description — Serbian" id="cat-desc">
            <Input id="cat-desc" name="description" defaultValue={category?.description ?? ""} className="h-10 rounded-xl" />
          </F>
          <F label="Description — English" id="cat-desc-en">
            <Input id="cat-desc-en" name="descriptionEn" defaultValue={category?.descriptionEn ?? ""} className="h-10 rounded-xl" />
          </F>
          <ImageUploadField
            name="imageUrl"
            label="Cover image (4:5)"
            kind="categoryCover"
            defaultValue={category?.imageUrl}
            suggestions={images}
            uploadsEnabled={uploadsEnabled}
            hint="Shown on the homepage cards. Cropped to 4:5 automatically."
          />
          <ImageUploadField
            name="thumbUrl"
            label="Thumbnail (square)"
            kind="categoryThumb"
            defaultValue={category?.thumbUrl}
            suggestions={images}
            uploadsEnabled={uploadsEnabled}
            hint="Shown in the shop's game tabs. Cropped square automatically."
          />
          <F label="Position" id="cat-sort">
            <Input id="cat-sort" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className="h-10 rounded-xl" />
          </F>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="size-4 accent-primary" />
            Visible on the site
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:col-span-2">
            <SubmitButton className="h-10 rounded-xl px-5">{category ? "Save changes" : "Create category"}</SubmitButton>
            <Button type="button" variant="ghost" className="h-10 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        {category && (
          <SubcategoriesEditor
            categoryId={category.id}
            fallbackImage={category.thumbUrl ?? category.imageUrl}
            subcategories={subcategories}
            uploadsEnabled={uploadsEnabled}
          />
        )}

        {category && (
          <form
            action={async (fd) => {
              await deleteCategory(fd);
              toast.success(category.products > 0 ? "Category hidden (it still has products)." : "Category deleted.");
              onClose();
            }}
            className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
          >
            <input type="hidden" name="id" value={category.id} />
            <p className="text-xs text-muted-foreground">
              {category.products > 0
                ? `Has ${category.products} products, so it will be hidden instead of deleted.`
                : "Permanently delete this empty category."}
            </p>
            <SubmitButton variant="destructive" className="h-9 shrink-0 rounded-lg">
              <Trash2Icon /> {category.products > 0 ? "Hide" : "Delete"}
            </SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function F({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
