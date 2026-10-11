import type { OrderStatus } from "@/lib/db/schema";
import { ORDER_STATUS_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  pending: "bg-gold/10 text-gold",
  paid: "bg-sky-400/10 text-sky-300",
  processing: "bg-sky-400/10 text-sky-300",
  delivered: "bg-primary/10 text-primary",
  cancelled: "bg-white/5 text-muted-foreground",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-white/5 text-muted-foreground",
};

/** `label` overrides the English admin label (the storefront passes the translated one). */
export function OrderStatusBadge({ status, label, className }: { status: OrderStatus; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label ?? ORDER_STATUS_LABEL[status]}
    </span>
  );
}
