import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { getI18n } from "@/i18n/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SignInPage() {
  const { href } = await getI18n();
  return (
    <div className="relative isolate flex flex-1 items-center justify-center px-4 pt-[6.5rem] pb-20">
      <div aria-hidden className="bg-hero-glow absolute inset-0 -z-10" />
      {/* Clerk reads the URL at runtime, so it streams in after the static shell. */}
      <Suspense>
        <SignIn path={href("/sign-in")} signUpUrl={href("/sign-up")} fallbackRedirectUrl={href("/profile")} />
      </Suspense>
    </div>
  );
}
