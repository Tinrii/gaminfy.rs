"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseCodeFieldLabels } from "@/lib/format";

let nextKey = 0;
const row = (label = "") => ({ key: `f-${++nextKey}`, label });

/**
 * Field labels for account-style codes (e.g. Email / Šifra Epic / Recovery mail).
 * Posted as "codeField" in order with the product form; none = plain one-line codes.
 */
export function CodeFieldsEditor({ defaultValue }: { defaultValue: string | null | undefined }) {
  const [rows, setRows] = useState(() => parseCodeFieldLabels(defaultValue).map((l) => row(l)));
  const move = (from: number, to: number) => {
    const next = [...rows];
    const [r] = next.splice(from, 1);
    next.splice(to, 0, r);
    setRows(next);
  };

  return (
    <fieldset className="space-y-3 rounded-xl border border-white/10 p-4">
      <legend className="px-1 text-sm font-medium">Code fields</legend>
      <p className="text-xs text-muted-foreground">
        Optional — for products delivered as an account instead of a single key. Add the fields each account has
        (e.g. Email, Šifra Epic, Šifra mail, Recovery mail, Sajt za mail). You then fill them in per account under
        Code stock, and the customer gets each field with its own copy button. Leave empty for plain one-line codes.
      </p>

      {rows.map((r, i) => (
        <div key={r.key} className="flex items-center gap-2">
          <Input
            name="codeField"
            value={r.label}
            onChange={(e) => setRows(rows.map((x) => (x.key === r.key ? { ...x, label: e.target.value } : x)))}
            placeholder={i === 0 ? "e.g. Email" : "Field name"}
            aria-label={`Code field ${i + 1}`}
            required
            maxLength={60}
            pattern="[^:]+"
            title="Field names can't contain a colon."
            className="h-10 max-w-sm rounded-xl"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => move(i, i - 1)}
            disabled={i === 0}
            aria-label={`Move field ${i + 1} up`}
            className="rounded-lg"
          >
            <ArrowUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => move(i, i + 1)}
            disabled={i === rows.length - 1}
            aria-label={`Move field ${i + 1} down`}
            className="rounded-lg"
          >
            <ArrowDownIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setRows(rows.filter((x) => x.key !== r.key))}
            aria-label={`Remove field ${i + 1}`}
            className="rounded-lg text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={() => setRows([...rows, row()])} className="rounded-lg">
        <PlusIcon /> Add field
      </Button>
    </fieldset>
  );
}
