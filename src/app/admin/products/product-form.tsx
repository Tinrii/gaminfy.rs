"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/db/schema";
import { CONTACT_FIELD_KEYS, CONTACT_FIELD_LABEL, parseContactFields } from "@/lib/format";
import { saveProduct } from "../actions";
import { ImageUploadField } from "../image-upload-field";
import { ActionForm, SubmitButton } from "../ui";

const selectClass = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

export function ProductForm({
  product,
  categories,
  subcategories,
  images,
  uploadsEnabled,
}: {
  product?: Product;
  categories: { id: number; name: string; imageUrl: string | null }[];
  subcategories: { id: number; categoryId: number; name: string }[];
  images: string[];
  uploadsEnabled: boolean;
}) {
  const [categoryId, setCategoryId] = useState(String(product?.categoryId ?? ""));
  const categoryImage = categories.find((c) => String(c.id) === categoryId)?.imageUrl ?? null;
  const subOptions = subcategories.filter((s) => String(s.categoryId) === categoryId);
  const [delivery, setDelivery] = useState(product?.deliveryType ?? "automatic");
  const contact = parseContactFields(product?.requiredContactFields);

  return (
    <ActionForm action={saveProduct} className="space-y-6 rounded-2xl border border-white/[0.06] bg-card p-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name — Serbian" htmlFor="name">
          <Input id="name" name="name" required defaultValue={product?.name} className="h-10 rounded-xl" />
        </Field>
        <Field label="Name — English" htmlFor="nameEn" hint="Optional — falls back to the Serbian name.">
          <Input id="nameEn" name="nameEn" defaultValue={product?.nameEn ?? ""} className="h-10 rounded-xl" />
        </Field>
        <Field label="URL slug" htmlFor="slug" hint="Leave empty to generate from the name.">
          <Input id="slug" name="slug" defaultValue={product?.slug} className="h-10 rounded-xl" />
        </Field>
        <Field label="Category" htmlFor="categoryId">
          <select
            id="categoryId"
            name="categoryId"
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {subOptions.length > 0 && (
          <Field label="Subcategory" htmlFor="subcategoryId" hint="Optional — groups the product inside its game.">
            {/* Re-mounted per category so a stale choice from another game is never submitted. */}
            <select
              key={categoryId}
              id="subcategoryId"
              name="subcategoryId"
              defaultValue={String(product?.categoryId) === categoryId ? (product?.subcategoryId ?? "") : ""}
              className={selectClass}
            >
              <option value="">None</option>
              {subOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Field label="Price" htmlFor="price" hint="In whole units, e.g. 1400 for 1,400 RSD.">
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={product ? product.priceMinor / 100 : undefined}
              className="h-10 rounded-xl"
            />
          </Field>
          <Field label="Currency" htmlFor="currency">
            <Input id="currency" name="currency" maxLength={3} defaultValue={product?.currency ?? "RSD"} className="h-10 rounded-xl uppercase" />
          </Field>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Delivery type</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["automatic", "Automatic codes", "A code from stock is emailed the moment payment clears."],
              ["manual", "Manual fulfillment", "Customer submits contact details; your team delivers."],
            ] as const
          ).map(([value, title, text]) => (
            <label
              key={value}
              className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-4 has-checked:border-primary/60 has-checked:bg-primary/5"
            >
              <input
                type="radio"
                name="deliveryType"
                value={value}
                checked={delivery === value}
                onChange={() => setDelivery(value)}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-muted-foreground">{text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {delivery === "manual" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Stock" htmlFor="manualStock" hint="Leave empty for unlimited. Decreases by 1 per paid order.">
            <Input
              id="manualStock"
              name="manualStock"
              type="number"
              min={0}
              defaultValue={product?.manualStock ?? ""}
              className="h-10 rounded-xl"
            />
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Preferred contact channels</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {CONTACT_FIELD_KEYS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="contactFields" value={f} defaultChecked={contact.includes(f)} className="accent-primary" />
                  {CONTACT_FIELD_LABEL[f]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <ImageUploadField
        name="imageUrl"
        label="Image"
        kind="product"
        defaultValue={product?.imageUrl}
        fallback={categoryImage}
        suggestions={images}
        uploadsEnabled={uploadsEnabled}
        hint="Drop an image or click Upload. Without its own image the product uses the category image."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Description — Serbian" htmlFor="description">
          <Textarea id="description" name="description" rows={4} defaultValue={product?.description ?? ""} className="rounded-xl" />
        </Field>
        <Field label="Description — English" htmlFor="descriptionEn">
          <Textarea id="descriptionEn" name="descriptionEn" rows={4} defaultValue={product?.descriptionEn ?? ""} className="rounded-xl" />
        </Field>
        <Field label="Instructions — Serbian" htmlFor="instructions" hint="Shown on the product page and in the delivery email.">
          <Textarea id="instructions" name="instructions" rows={4} defaultValue={product?.instructions ?? ""} className="rounded-xl" />
        </Field>
        <Field label="Instructions — English" htmlFor="instructionsEn">
          <Textarea id="instructionsEn" name="instructionsEn" rows={4} defaultValue={product?.instructionsEn ?? ""} className="rounded-xl" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Field label="Sort order" htmlFor="sortOrder">
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={product?.sortOrder ?? 0} className="h-10 w-28 rounded-xl" />
        </Field>
        <label className="mt-6 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="size-4 accent-primary" />
          Visible in the marketplace
        </label>
      </div>

      <SubmitButton className="h-10 rounded-xl px-6">{product ? "Save changes" : "Create product"}</SubmitButton>
    </ActionForm>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
