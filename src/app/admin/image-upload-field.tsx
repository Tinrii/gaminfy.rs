"use client";

import { useId, useRef, useState, useTransition } from "react";
import { ImagePlusIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/shop/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadImage, type UploadKind } from "./actions";

const ASPECT: Record<UploadKind, string> = {
  product: "aspect-square",
  categoryCover: "aspect-[4/5]",
  categoryThumb: "aspect-square",
  subcategory: "aspect-square",
};

/** Longest edge sent to the server; it re-encodes to the final size anyway. */
const MAX_EDGE = 1600;

/** Shrinks big photos in the browser so uploads stay small and fast. */
async function downscale(file: File): Promise<Blob> {
  if (file.type === "image/avif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
  return blob ?? file;
}

export function ImageUploadField({
  name,
  label,
  kind,
  defaultValue,
  fallback,
  hint,
  suggestions,
  uploadsEnabled,
  onChange,
  className,
}: {
  name: string;
  label: string;
  kind: UploadKind;
  defaultValue?: string | null;
  /** Image the shop shows when this field is empty (e.g. a product falling back to its category art). */
  fallback?: string | null;
  hint?: string;
  suggestions?: string[];
  uploadsEnabled: boolean;
  onChange?: (url: string) => void;
  className?: string;
}) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();

  const update = (next: string) => {
    setUrl(next);
    onChange?.(next);
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("That isn't an image file.");
    startTransition(async () => {
      try {
        const blob = await downscale(file);
        const fd = new FormData();
        fd.append("file", new File([blob], file.name, { type: blob.type || file.type }));
        fd.append("kind", kind);
        const result = await uploadImage(fd);
        if (result.error) toast.error(result.error);
        else if (result.url) {
          update(result.url);
          toast.success("Image uploaded — save to apply it.");
        }
      } catch {
        toast.error("Upload failed — try again.");
      }
    });
  };

  const listId = `${id}-images`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`${id}-url`}>{label}</Label>
      <div className="flex gap-4">
        <button
          type="button"
          disabled={!uploadsEnabled || pending}
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (uploadsEnabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (uploadsEnabled) upload(e.dataTransfer.files[0]);
          }}
          aria-label={uploadsEnabled ? "Upload image" : "Image preview"}
          className={cn(
            "group relative w-28 shrink-0 overflow-hidden rounded-xl border border-dashed bg-background/60 transition-colors",
            ASPECT[kind],
            dragging ? "border-primary bg-primary/10" : "border-white/15",
            uploadsEnabled && !pending && "hover:border-primary/60",
          )}
        >
          {url || fallback ? (
            <ProductImage src={url || fallback!} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImagePlusIcon className="size-6" />
            </span>
          )}
          {!url && fallback && (
            <span className="absolute inset-x-0 bottom-0 bg-background/80 px-1 py-0.5 text-[0.6rem] font-medium text-muted-foreground backdrop-blur">
              Category image
            </span>
          )}
          {pending && (
            <span className="absolute inset-0 grid place-items-center bg-background/75">
              <Loader2Icon className="size-5 animate-spin text-primary" />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 rounded-lg"
              disabled={!uploadsEnabled || pending}
              onClick={() => fileInput.current?.click()}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
              {url ? "Replace" : "Upload"}
            </Button>
            {url && (
              <Button type="button" variant="ghost" size="sm" className="h-9 rounded-lg text-muted-foreground" disabled={pending} onClick={() => update("")}>
                <XIcon /> {fallback !== undefined ? "Use category image" : "Remove"}
              </Button>
            )}
          </div>
          <Input
            id={`${id}-url`}
            name={name}
            value={url}
            onChange={(e) => update(e.target.value)}
            list={suggestions?.length ? listId : undefined}
            placeholder="/games/… or https://…"
            className="h-9 rounded-lg text-xs"
          />
          {suggestions?.length ? (
            <datalist id={listId}>
              {suggestions.map((src) => (
                <option key={src} value={src} />
              ))}
            </datalist>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {uploadsEnabled
              ? (hint ?? "Drop an image or click Upload. JPG, PNG, WEBP — converted automatically.")
              : "Uploads are off until Cloudflare R2 is configured — paste a /games/… path or https:// URL."}
          </p>
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
