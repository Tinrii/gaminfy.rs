"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { splitCodeFields } from "@/lib/format";

function CopyButton({ text, compact }: { text: string; compact?: boolean }) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size={compact ? "sm" : "default"}
      className={compact ? "shrink-0 rounded-lg" : "h-10 shrink-0 rounded-xl"}
      aria-label={compact ? dict.order.copy : undefined}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {!compact && (copied ? dict.order.copied : dict.order.copy)}
    </Button>
  );
}

export function CopyCode({ code }: { code: string }) {
  // Account codes ("Label: value" lines) get one row and copy button per field.
  const fields = splitCodeFields(code);
  if (fields) {
    return (
      <dl className="mt-4 divide-y divide-white/[0.06] rounded-2xl border border-dashed border-primary/50 bg-background/60">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-2 pl-4">
            <div className="min-w-0 flex-1">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="font-mono break-all">{f.value}</dd>
            </div>
            <CopyButton text={f.value} compact />
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-background/60 p-2 pl-4">
      <code className="min-w-0 flex-1 font-mono text-lg tracking-wider break-all">{code}</code>
      <CopyButton text={code} />
    </div>
  );
}
