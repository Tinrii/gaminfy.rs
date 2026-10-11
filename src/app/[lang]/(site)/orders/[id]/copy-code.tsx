"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

export function CopyCode({ code }: { code: string }) {
  const { dict } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-background/60 p-2 pl-4">
      <code className="min-w-0 flex-1 font-mono text-lg tracking-wider break-all">{code}</code>
      <Button
        type="button"
        variant="secondary"
        className="h-10 rounded-xl"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? dict.order.copied : dict.order.copy}
      </Button>
    </div>
  );
}
