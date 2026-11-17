"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

let nextKey = 0;

/**
 * One card of inputs per account, for products with code fields. Inputs are posted as
 * "field-<index>" so the action can zip them back into accounts in order.
 */
export function AccountCodesFields({ labels }: { labels: string[] }) {
  const [accounts, setAccounts] = useState(() => [++nextKey]);

  return (
    <div className="space-y-3">
      {accounts.map((key, a) => (
        <div key={key} className="space-y-3 rounded-xl border border-white/[0.06] bg-background/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Account {a + 1}</span>
            {accounts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setAccounts(accounts.filter((k) => k !== key))}
                aria-label={`Remove account ${a + 1}`}
                className="rounded-lg text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {labels.map((label, i) => (
              <label key={label} className="space-y-1.5">
                <span className="block text-xs text-muted-foreground">{label}</span>
                <Input
                  name={`field-${i}`}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={500}
                  className="h-10 rounded-xl font-mono text-sm"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => setAccounts([...accounts, ++nextKey])} className="rounded-lg">
        <PlusIcon /> Add another account
      </Button>
    </div>
  );
}
