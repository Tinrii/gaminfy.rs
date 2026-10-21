"use client";

import { useActionState, useEffect, useState } from "react";
import { EyeOffIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminSubcategory } from "@/lib/admin-data";
import { cn } from "@/lib/utils";
import { deleteSubcategory, saveSubcategory, type AdminState } from "../actions";
import { ImageUploadField } from "../image-upload-field";
import { SubmitButton } from "../ui";

/** Subcategories of one category (e.g. Fortnite → V-Bucks, Packs…), edited inside the category dialog. */
export function SubcategoriesEditor({
  categoryId,
  fallbackImage,
  subcategories,
  uploadsEnabled,
}: {
  categoryId: number;
  /** What the marketplace tile shows when a subcategory has no icon. */
  fallbackImage: string | null;
  subcategories: AdminSubcategory[];
  uploadsEnabled: boolean;
}) {
  // null = adding, number = editing that id
  const [open, setOpen] = useState<number | null | undefined>(undefined);

  return (
    <section className="space-y-3 rounded-xl border border-white/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Subcategories</h3>
          <p className="text-xs text-muted-foreground">
            Optional tiles above the marketplace filters. Assign products to them in the product form.
          </p>
        </div>
        {open !== null && (
          <Button type="button" size="sm" variant="secondary" className="h-8 shrink-0 rounded-lg" onClick={() => setOpen(null)}>
            <PlusIcon /> Add
          </Button>
        )}
      </div>

      {subcategories.length === 0 && open !== null && (
        <p className="text-xs text-muted-foreground">None yet — this game shows no subcategory panel.</p>
      )}

      <ul className="space-y-2">
        {subcategories.map((s) =>
          open === s.id ? (
            <li key={s.id}>
              <SubcategoryForm
                categoryId={categoryId}
                subcategory={s}
                fallbackImage={fallbackImage}
                uploadsEnabled={uploadsEnabled}
                onDone={() => setOpen(undefined)}
              />
            </li>
          ) : (
            <li
              key={s.id}
              className={cn("flex items-center gap-3 rounded-lg border border-white/[0.06] px-3 py-2", !s.isActive && "opacity-60")}
            >
              <span className="relative size-9 shrink-0">
                <ProductImage src={s.imageUrl ?? fallbackImage} alt="" fill sizes="36px" className="object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {s.name}
                  {!s.isActive && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <EyeOffIcon className="size-3" /> Hidden
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  /{s.slug} · {s.products} product{s.products === 1 ? "" : "s"} · #{s.sortOrder}
                </span>
              </span>
              <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg" onClick={() => setOpen(s.id)}>
                <PencilIcon /> Edit
              </Button>
            </li>
          ),
        )}
        {open === null && (
          <li>
            <SubcategoryForm
              categoryId={categoryId}
              fallbackImage={fallbackImage}
              uploadsEnabled={uploadsEnabled}
              nextSortOrder={Math.max(-1, ...subcategories.map((s) => s.sortOrder)) + 1}
              onDone={() => setOpen(undefined)}
            />
          </li>
        )}
      </ul>
    </section>
  );
}

function SubcategoryForm({
  categoryId,
  subcategory,
  fallbackImage,
  uploadsEnabled,
  nextSortOrder = 0,
  onDone,
}: {
  categoryId: number;
  subcategory?: AdminSubcategory;
  fallbackImage: string | null;
  uploadsEnabled: boolean;
  nextSortOrder?: number;
  onDone: () => void;
}) {
  const [state, action] = useActionState<AdminState, FormData>(saveSubcategory, {});
  const s = subcategory;
  const key = s?.id ?? "new";

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/[0.03] p-3">
      {/* Not a nested <form>: this sits inside the dialog, outside the category form. */}
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="categoryId" value={categoryId} />
        {s && <input type="hidden" name="id" value={s.id} />}
        <Field label="Name — Serbian" id={`sub-name-${key}`}>
          <Input id={`sub-name-${key}`} name="name" required defaultValue={s?.name} placeholder="Fortnite Vbucksi" className="h-9 rounded-lg" />
        </Field>
        <Field label="Name — English" id={`sub-name-en-${key}`}>
          <Input id={`sub-name-en-${key}`} name="nameEn" defaultValue={s?.nameEn ?? ""} placeholder="Fortnite V-Bucks" className="h-9 rounded-lg" />
        </Field>
        <Field label="URL slug" id={`sub-slug-${key}`}>
          <Input id={`sub-slug-${key}`} name="slug" defaultValue={s?.slug} placeholder="auto" className="h-9 rounded-lg" />
        </Field>
        <Field label="Position" id={`sub-sort-${key}`}>
          <Input
            id={`sub-sort-${key}`}
            name="sortOrder"
            type="number"
            defaultValue={s?.sortOrder ?? nextSortOrder}
            className="h-9 rounded-lg"
          />
        </Field>
        <ImageUploadField
          name="imageUrl"
          label="Icon"
          kind="subcategory"
          defaultValue={s?.imageUrl}
          fallback={fallbackImage}
          uploadsEnabled={uploadsEnabled}
          hint="Square icon shown on the tile — a cut-out with a transparent background (PNG/WebP) looks best. Empty = the category thumbnail."
          className="sm:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked={s?.isActive ?? true} className="size-4 accent-primary" />
          Visible in the marketplace
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <SubmitButton className="h-9 rounded-lg px-4">{s ? "Save subcategory" : "Add subcategory"}</SubmitButton>
          <Button type="button" variant="ghost" className="h-9 rounded-lg" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>

      {s && (
        <form
          action={async (fd) => {
            await deleteSubcategory(fd);
            toast.success(s.products > 0 ? "Subcategory hidden (it still has products)." : "Subcategory deleted.");
            onDone();
          }}
          className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3"
        >
          <input type="hidden" name="id" value={s.id} />
          <p className="text-xs text-muted-foreground">
            {s.products > 0 ? `Has ${s.products} products, so it will be hidden instead of deleted.` : "Permanently delete this subcategory."}
          </p>
          <SubmitButton variant="destructive" className="h-8 shrink-0 rounded-lg">
            <Trash2Icon /> {s.products > 0 ? "Hide" : "Delete"}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
