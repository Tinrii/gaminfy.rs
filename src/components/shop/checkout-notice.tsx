"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/i18n/client";

export function CheckoutNotice() {
  const { dict } = useI18n();
  if (useSearchParams().get("checkout") !== "cancelled") return null;
  return (
    <Alert className="mt-6">
      <AlertTitle>{dict.product.cancelledTitle}</AlertTitle>
      <AlertDescription>{dict.product.cancelledText}</AlertDescription>
    </Alert>
  );
}
