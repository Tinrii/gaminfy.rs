"use client";

import { CheckIcon, ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-context";

/** Adds a product to the cart with a short "added" confirmation and a toast to open the cart. */
export function AddToCartButton({
  productId,
  productName,
  quantity = 1,
  disabled,
  variant = "full",
  className,
}: {
  productId: number;
  productName: string;
  quantity?: number;
  disabled?: boolean;
  /** "icon" is the compact round button used on product cards. */
  variant?: "full" | "icon";
  className?: string;
}) {
  const { dict } = useI18n();
  const { add, setOpen } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add(productId, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
    toast.success(dict.cart.added, {
      description: productName,
      action: { label: dict.cart.view, onClick: () => setOpen(true) },
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={`${dict.cart.add}: ${productName}`}
        title={dict.cart.add}
        className={cn(
          "grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-[transform,background-color] hover:scale-105 hover:bg-primary/90 disabled:pointer-events-none disabled:bg-white/10 disabled:text-muted-foreground disabled:shadow-none",
          className,
        )}
      >
        {justAdded ? <CheckIcon className="size-4" /> : <ShoppingCartIcon className="size-4" />}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-12 rounded-xl px-5 text-base font-semibold", className)}
    >
      {justAdded ? <CheckIcon /> : <ShoppingCartIcon />}
      {justAdded ? dict.cart.added : dict.cart.add}
    </Button>
  );
}
