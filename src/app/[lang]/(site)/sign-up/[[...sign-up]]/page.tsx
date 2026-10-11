import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { getI18n } from "@/i18n/server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SignUpPage() {
  const { href } = await getI18n();
  return (
    <div className="relative isolate flex flex-1 items-center justify-center px-4 pt-[6.5rem] pb-20">
      <div aria-hidden className="bg-hero-glow absolute inset-0 -z-10" />
      {/* Clerk reads the URL at runtime, so it streams in after the static shell. */}
      <Suspense>
        <SignUp path={href("/sign-up")} signInUrl={href("/sign-in")} fallbackRedirectUrl={href("/profile")} />
      </Suspense>
    </div>
  );
}
