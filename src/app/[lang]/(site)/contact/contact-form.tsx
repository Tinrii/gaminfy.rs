"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleCheckIcon, Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { sendContactMessage, type ContactState } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";

export function ContactForm() {
  const { dict } = useI18n();
  const c = dict.contact;
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactMessage, {});
  // The success screen is shown until the visitor dismisses that particular result.
  const [dismissed, setDismissed] = useState<ContactState | null>(null);

  useEffect(() => {
    if (state.error) toast.error(c.errors[state.error]);
  }, [state, c]);

  if (state.ok && state !== dismissed) {
    return (
      <div className="flex h-full min-h-[30rem] flex-col items-center justify-center p-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary/15">
          <CircleCheckIcon className="size-8 text-primary" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold">{c.sentTitle}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{c.sentText}</p>
        <Button variant="outline" className="mt-8 rounded-xl" onClick={() => setDismissed(state)}>
          {c.sendAnother}
        </Button>
      </div>
    );
  }

  const err = Object.fromEntries(
    Object.entries(state.fieldErrors ?? {}).map(([k, v]) => [k, c.errors[v]]),
  ) as Partial<Record<"name" | "email" | "message", string>>;

  return (
    <form
      key={dismissed ? "again" : "first"}
      action={action}
      noValidate
      className="space-y-6 p-6 sm:p-10"
    >
      <h2 className="text-2xl font-semibold tracking-tight">{c.formTitle}</h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label={c.name} error={err.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            defaultValue={state.values?.name}
            aria-invalid={!!err.name}
            aria-describedby={err.name ? "name-error" : undefined}
            className="h-12 rounded-xl border-white/10 bg-background/50"
          />
        </Field>
        <Field id="email" label={c.email} error={err.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            aria-invalid={!!err.email}
            aria-describedby={err.email ? "email-error" : undefined}
            className="h-12 rounded-xl border-white/10 bg-background/50"
          />
        </Field>
      </div>

      <Field id="orderNumber" label={c.orderNumber}>
          <Input
            id="orderNumber"
            name="orderNumber"
            inputMode="numeric"
            placeholder="#1234"
            defaultValue={state.values?.orderNumber}
            className="h-12 rounded-xl border-white/10 bg-background/50"
          />
        </Field>

      <Field id="message" label={c.message} error={err.message}>
        <Textarea
          id="message"
          name="message"
          required
          rows={6}
          defaultValue={state.values?.message}
          aria-invalid={!!err.message}
          aria-describedby={err.message ? "message-error" : undefined}
          placeholder={c.messagePlaceholder}
          className="min-h-36 rounded-xl border-white/10 bg-background/50"
        />
      </Field>

      {/* Honeypot for bots — hidden from people and screen readers */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending} className="h-12 shrink-0 rounded-xl px-7 font-semibold">
          {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
          {c.send}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
