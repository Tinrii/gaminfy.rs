"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useReverification, useUser } from "@clerk/nextjs";
import { CameraIcon, Link2Icon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/dictionaries";

const PROVIDERS = [
  { provider: "google", strategy: "oauth_google", name: "Google", icon: GoogleIcon },
  { provider: "discord", strategy: "oauth_discord", name: "Discord", icon: DiscordIcon },
] as const;

const card = "rounded-3xl border border-white/[0.06] bg-card p-6 sm:p-8";

export function AccountSettings() {
  const { isLoaded, user } = useUser();
  const { dict } = useI18n();
  const a = dict.account;

  const fileInput = useRef<HTMLInputElement>(null);
  const [savingProfile, startProfile] = useTransition();
  const [savingPhoto, startPhoto] = useTransition();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  // Linking/unlinking is sensitive, so Clerk may ask the user to confirm their identity first.
  const connect = useReverification((strategy: (typeof PROVIDERS)[number]["strategy"]) =>
    user!.createExternalAccount({ strategy, redirectUrl: window.location.href }),
  );
  const disconnect = useReverification((id: string) => user!.externalAccounts.find((e) => e.id === id)!.destroy());

  if (!isLoaded || !user) return <Skeleton className="mt-8 h-[28rem] rounded-3xl" />;

  const fail = (err: unknown) => {
    console.error(err);
    const message = (err as { errors?: { longMessage?: string }[] })?.errors?.[0]?.longMessage;
    toast.error(message ?? a.error);
  };

  const saveProfile = (form: FormData) =>
    startProfile(async () => {
      try {
        await user.update({
          firstName: String(form.get("firstName") ?? "").trim(),
          lastName: String(form.get("lastName") ?? "").trim(),
        });
        toast.success(a.saved);
      } catch (err) {
        fail(err);
      }
    });

  const changePhoto = (file: File | null) =>
    startPhoto(async () => {
      try {
        await user.setProfileImage({ file });
        toast.success(a.photoSaved);
      } catch (err) {
        fail(err);
      }
    });

  return (
    <div className="mt-8 space-y-6">
      <section className={card}>
        <h2 className="font-semibold">{a.photo}</h2>
        <div className="mt-5 flex flex-wrap items-center gap-5">
          <div className="relative size-20 overflow-hidden rounded-full ring-2 ring-primary/50 ring-offset-4 ring-offset-card">
            <Image src={user.imageUrl} alt="" fill sizes="80px" className="object-cover" />
            {savingPhoto && (
              <span className="absolute inset-0 grid place-items-center bg-background/70">
                <Loader2Icon className="size-5 animate-spin" />
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="rounded-xl" disabled={savingPhoto} onClick={() => fileInput.current?.click()}>
                <CameraIcon /> {a.changePhoto}
              </Button>
              {user.hasImage && (
                <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" disabled={savingPhoto} onClick={() => changePhoto(null)}>
                  <Trash2Icon /> {a.removePhoto}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{a.photoHint}</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file && file.size <= 10 * 1024 * 1024) changePhoto(file);
                else if (file) toast.error(a.photoHint);
              }}
            />
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">{a.profileSection}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{a.profileText}</p>
        <form action={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">{a.firstName}</Label>
            <Input id="firstName" name="firstName" defaultValue={user.firstName ?? ""} maxLength={60} autoComplete="given-name" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{a.lastName}</Label>
            <Input id="lastName" name="lastName" defaultValue={user.lastName ?? ""} maxLength={60} autoComplete="family-name" className="h-11 rounded-xl" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={savingProfile} className="h-11 rounded-xl px-6 font-semibold">
              {savingProfile && <Loader2Icon className="animate-spin" />}
              {a.save}
            </Button>
          </div>
        </form>
      </section>

      <section className={card}>
        <h2 className="font-semibold">{a.connections}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{a.connectionsText}</p>
        <ul className="mt-5 space-y-3">
          {PROVIDERS.map(({ provider, strategy, name, icon: Icon }) => {
            const account = user.externalAccounts.find(
              (e) => e.provider === provider && e.verification?.status === "verified",
            );
            const busy = busyProvider === provider;
            return (
              <li key={provider} className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-background/50 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.04]">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {account ? t(a.connectedAs, { account: account.emailAddress || account.username || name }) : a.notConnected}
                  </p>
                </div>
                {account ? (
                  <Button
                    variant="ghost"
                    className="rounded-xl text-muted-foreground hover:text-destructive"
                    disabled={busy}
                    onClick={async () => {
                      setBusyProvider(provider);
                      try {
                        await disconnect(account.id);
                        toast.success(a.disconnected);
                      } catch (err) {
                        fail(err);
                      } finally {
                        setBusyProvider(null);
                      }
                    }}
                  >
                    {busy && <Loader2Icon className="animate-spin" />}
                    {a.disconnect}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    disabled={busy}
                    onClick={async () => {
                      setBusyProvider(provider);
                      try {
                        const created = await connect(strategy);
                        const url = created?.verification?.externalVerificationRedirectURL;
                        if (url) window.location.href = url.href;
                        else setBusyProvider(null);
                      } catch (err) {
                        fail(err);
                        setBusyProvider(null);
                      }
                    }}
                  >
                    {busy ? <Loader2Icon className="animate-spin" /> : <Link2Icon />}
                    {a.connect}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6a5.1 5.1 0 0 1-2.2 3.3v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="#5865F2">
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.6 0L8.6 3a19.7 19.7 0 0 0-4.9 1.5C.6 9.1-.3 13.6.1 18.1a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4a12.9 12.9 0 0 1-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  );
}
