"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleCheckIcon, Loader2Icon, SendIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { sendCs2Request, type Cs2RequestState } from "@/app/actions/cs2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n/client";
import { CS2_WEARS, WHATSAPP_NUMBER } from "@/lib/site";
import { cn } from "@/lib/utils";

type Kind = "buy" | "sell";
type Values = { skin: string; wear: (typeof CS2_WEARS)[number]; amount: string; tradeUrl: string; contact: string; notes: string };

const EMPTY: Values = { skin: "", wear: "any", amount: "", tradeUrl: "", contact: "", notes: "" };
/** Links elsewhere on the page (#kupovina / #otkup) open the form on that tab. */
const HASH: Record<Kind, string> = { buy: "#kupovina", sell: "#otkup" };

const fieldClass = "h-12 rounded-xl border-white/10 bg-background/60";

export function Cs2RequestForm() {
  const { dict } = useI18n();
  const f = dict.cs2.form;
  const [state, action, pending] = useActionState<Cs2RequestState, FormData>(sendCs2Request, {});
  const [dismissed, setDismissed] = useState<Cs2RequestState | null>(null);
  const [kind, setKind] = useState<Kind>("buy");
  // Controlled, so a failed submit keeps what was typed and WhatsApp can reuse it.
  const [values, setValues] = useState<Values>(EMPTY);
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  useEffect(() => {
    const sync = () => {
      if (location.hash === HASH.sell) setKind("sell");
      else if (location.hash === HASH.buy) setKind("buy");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (state.error) toast.error(f.errors[state.error]);
  }, [state, f]);

  const choose = (k: Kind) => {
    setKind(k);
    // Keeps the hash in step, so the page's "sell" / "buy" links switch tabs again later.
    history.replaceState(null, "", HASH[k]);
  };

  const amountLabel = kind === "buy" ? f.budget : f.price;
  const err = Object.fromEntries(Object.entries(state.fieldErrors ?? {}).map(([k, v]) => [k, f.errors[v]])) as Partial<
    Record<"skin" | "contact" | "tradeUrl" | "amount", string>
  >;

  const whatsappHref = () => {
    const lines = [
      f.whatsappIntro,
      `${f.kindLabel}: ${kind === "buy" ? f.buy : f.sell}`,
      values.skin && `${f.skin}: ${values.skin}`,
      `${f.wear}: ${f.wears[values.wear]}`,
      values.amount && `${amountLabel}: ${values.amount}`,
      values.tradeUrl && `${f.tradeUrl}: ${values.tradeUrl}`,
      values.notes && `${f.notes}: ${values.notes}`,
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
  };

  if (state.ok && state !== dismissed) {
    return (
      <div className="flex min-h-[28rem] flex-col items-center justify-center p-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary/15">
          <CircleCheckIcon className="size-8 text-primary" />
        </span>
        <h3 className="mt-6 text-2xl font-semibold">{f.sentTitle}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{f.sentText}</p>
        <Button
          variant="outline"
          className="mt-8 rounded-xl"
          onClick={() => {
            setValues(EMPTY);
            setDismissed(state);
          }}
        >
          {f.sendAnother}
        </Button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5 p-5 sm:p-8">
      <div>
        <h3 className="text-xl font-semibold sm:text-2xl">{f.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
      </div>

      <div role="radiogroup" aria-label={f.kindLabel} className="grid grid-cols-2 gap-1 rounded-xl bg-background/60 p-1">
        {(["buy", "sell"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => choose(k)}
            className={cn(
              "h-10 rounded-lg text-sm font-semibold transition-colors",
              kind === k ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "buy" ? f.buy : f.sell}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      <Field id="cs2-skin" label={f.skin} error={err.skin}>
        <Input
          id="cs2-skin"
          name="skin"
          required
          value={values.skin}
          onChange={set("skin")}
          placeholder={f.skinPlaceholder}
          aria-invalid={!!err.skin}
          aria-describedby={err.skin ? "cs2-skin-error" : undefined}
          className={fieldClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="cs2-wear" label={f.wear}>
          <select
            id="cs2-wear"
            name="wear"
            value={values.wear}
            onChange={set("wear")}
            className={cn(fieldClass, "w-full border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&_option]:bg-popover")}
          >
            {CS2_WEARS.map((w) => (
              <option key={w} value={w}>
                {f.wears[w]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="cs2-amount" label={amountLabel} error={err.amount}>
          <Input
            id="cs2-amount"
            name="amount"
            inputMode="decimal"
            value={values.amount}
            onChange={set("amount")}
            placeholder={f.amountPlaceholder}
            aria-invalid={!!err.amount}
            aria-describedby={err.amount ? "cs2-amount-error" : undefined}
            className={fieldClass}
          />
        </Field>
      </div>

      <Field id="cs2-trade" label={f.tradeUrl} error={err.tradeUrl} hint={f.tradeUrlHint}>
        <Input
          id="cs2-trade"
          name="tradeUrl"
          type="url"
          inputMode="url"
          value={values.tradeUrl}
          onChange={set("tradeUrl")}
          placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…"
          aria-invalid={!!err.tradeUrl}
          aria-describedby={err.tradeUrl ? "cs2-trade-error" : "cs2-trade-hint"}
          className={fieldClass}
        />
      </Field>

      <Field id="cs2-contact" label={f.contact} error={err.contact}>
        <Input
          id="cs2-contact"
          name="contact"
          required
          value={values.contact}
          onChange={set("contact")}
          placeholder={f.contactPlaceholder}
          aria-invalid={!!err.contact}
          aria-describedby={err.contact ? "cs2-contact-error" : undefined}
          className={fieldClass}
        />
      </Field>

      <Field id="cs2-notes" label={f.notes}>
        <Textarea
          id="cs2-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          value={values.notes}
          onChange={set("notes")}
          placeholder={f.notesPlaceholder}
          className="min-h-24 rounded-xl border-white/10 bg-background/60"
        />
      </Field>

      {/* Honeypot for bots — hidden from people and screen readers */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="submit" size="lg" disabled={pending} className="h-12 rounded-xl font-semibold">
          {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
          {f.submit}
        </Button>
        <Button asChild type="button" size="lg" variant="outline" className="h-12 rounded-xl border-[#25D366]/50 font-semibold text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]">
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
            {f.whatsapp}
          </a>
        </Button>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="mt-px size-4 shrink-0 text-primary" />
        {f.safety}
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
