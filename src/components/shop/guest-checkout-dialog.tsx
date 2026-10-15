"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Loader2Icon, LockIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/client";

const STORAGE_KEY = "gaminfy:guest-email";

const savedEmail = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

/** Shown to signed-out visitors before checkout: pay as a guest with an email, or sign in. */
export function GuestCheckoutDialog({
  open,
  onOpenChange,
  onContinue,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (email: string) => void;
  pending: boolean;
  error?: string;
}) {
  const { dict, href } = useI18n();
  const g = dict.guestCheckout;
  const pathname = usePathname();
  const [email, setEmail] = useState(savedEmail);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    onContinue(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{g.title}</DialogTitle>
          <DialogDescription>{g.text}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-email">{g.email}</Label>
            <Input
              id="guest-email"
              type="email"
              required
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={g.emailPlaceholder}
              className="h-11 rounded-xl"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" size="lg" disabled={pending} className="h-12 w-full rounded-xl text-base font-semibold">
            {pending ? <Loader2Icon className="animate-spin" /> : <LockIcon />}
            {g.continue}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" />
          {g.or}
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-2 text-center">
          <Button asChild variant="outline" className="h-11 w-full rounded-xl">
            <Link href={`${href("/sign-in")}?redirect_url=${encodeURIComponent(pathname)}`}>{g.signIn}</Link>
          </Button>
          <p className="text-xs text-muted-foreground">{g.signInText}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
