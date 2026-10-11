"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { useI18n } from "@/i18n/client";

/** Stripe's webhook can land a few seconds after the redirect — re-check for up to a minute. */
export function PaymentPoller() {
  const { dict } = useI18n();
  const router = useRouter();

  useEffect(() => {
    let ticks = 0;
    const timer = setInterval(() => {
      if (++ticks > 20) return clearInterval(timer);
      router.refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <p className="mt-6 flex items-center gap-2 rounded-2xl bg-gold/10 px-4 py-3 text-sm text-gold">
      <Loader2Icon className="size-4 animate-spin" />
      {dict.order.waiting}
    </p>
  );
}
