"use client";

import { useActionState, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { submitFulfillmentDetails, type FulfillmentState } from "@/app/actions/fulfillment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import { CONTACT_FIELD_KEYS, type ContactField } from "@/lib/format";

type Details = {
  discordUsername: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  notes: string | null;
} | null;

const NAME: Record<ContactField, keyof NonNullable<Details>> = {
  discord: "discordUsername",
  email: "email",
  phone: "phone",
  instagram: "instagram",
};

export function FulfillmentForm({
  orderId,
  token,
  highlight,
  initial,
}: {
  orderId: number;
  /** Guest orders prove access with the token from their order link. */
  token?: string | null;
  highlight: ContactField[];
  initial: Details;
}) {
  const { dict } = useI18n();
  const o = dict.order;
  const [state, action, pending] = useActionState<FulfillmentState, FormData>(submitFulfillmentDetails, {});

  useEffect(() => {
    if (state.ok) toast.success(o.detailsSent);
    if (state.error) toast.error(o.errors[state.error]);
  }, [state, o]);

  // Show the product's preferred channels first.
  const fields = [...highlight, ...CONTACT_FIELD_KEYS.filter((f) => !highlight.includes(f))];

  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="orderId" value={orderId} />
      {token && <input type="hidden" name="token" value={token} />}
      <p className="text-xs text-muted-foreground">{o.atLeastOne}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f} className="space-y-2">
            <Label htmlFor={f}>{dict.contactFields[f].label}</Label>
            <Input
              id={f}
              name={NAME[f]}
              type={f === "email" ? "email" : f === "phone" ? "tel" : "text"}
              placeholder={dict.contactFields[f].placeholder}
              defaultValue={initial?.[NAME[f]] ?? ""}
              className="h-11 rounded-xl"
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">{o.details}</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={initial?.notes ?? ""} placeholder={o.detailsPlaceholder} className="rounded-xl" />
      </div>
      <Button type="submit" disabled={pending} className="h-11 rounded-xl px-6 font-semibold">
        {pending && <Loader2Icon className="animate-spin" />}
        {initial ? o.updateDetails : o.sendDetails}
      </Button>
    </form>
  );
}
