"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminState } from "./actions";

/** Form bound to an admin server action, with toast feedback. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: AdminState, formData: FormData) => Promise<AdminState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
    else if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}

export function SubmitButton({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending && <Loader2Icon className="animate-spin" />}
      {children}
    </Button>
  );
}
