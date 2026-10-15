"use client";

import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { ProductCard as ProductCardData } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const { dict, href } = useI18n();
  // The whole card is clickable through the title link's stretched ::after, which
  // keeps the add-to-cart button outside the link (no nested interactive elements).
  return (
    <div
      data-reveal
      className={cn(
        "group relative flex flex-col rounded-2xl border border-white/[0.06] bg-card p-3 transition-[border-color,transform,box-shadow] duration-300",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-20px] hover:shadow-primary/30",
        !product.inStock && "opacity-70",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
        <ProductImage
          src={product.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
          className={cn(
            "object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]",
            !product.inStock && "grayscale",
          )}
        />
        <div className="absolute inset-x-2 top-2 flex justify-between gap-2">
          {product.inStock ? (
            product.deliveryType === "automatic" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-[0.65rem] font-semibold text-primary backdrop-blur">
                <ZapIcon className="size-3" /> {dict.product.instant}
              </span>
            )
          ) : (
            <span className="rounded-full bg-background/85 px-2 py-1 text-[0.65rem] font-semibold text-destructive backdrop-blur">
              {dict.product.outOfStock}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1 pt-3 pb-1">
        <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{product.categoryName}</p>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          <Link
            href={href(`/product/${product.slug}`)}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <Price minor={product.priceMinor} currency={product.currency} className="block text-base font-semibold text-primary" />
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            disabled={!product.inStock}
            variant="icon"
            className="relative z-10 size-9"
          />
        </div>
      </div>
    </div>
  );
}
