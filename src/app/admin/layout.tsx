import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { ClerkProvider, UserAvatar } from "@clerk/nextjs";
import { ArrowUpRightIcon } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Toaster } from "@/components/ui/sonner";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { AdminLogout } from "./admin-logout";
import { ActiveAdminNav, AdminNav } from "./admin-nav";
import "../globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Admin · Gaminfy", template: "%s · Admin · Gaminfy" },
  robots: { index: false, follow: false },
};

// Separate root layout (the storefront's lives under [lang]). Navigation chrome only —
// every page and action enforces requireAdmin() itself.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="h-dvh overflow-hidden">
        <ClerkProvider appearance={clerkAppearance}>
          <div className="flex h-full">
            <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.06] bg-sidebar md:flex">
              <Link href="/admin" className="flex h-16 items-center gap-2.5 border-b border-white/[0.06] px-5">
                <Logo />
                <span className="rounded border border-primary/30 px-1.5 py-px text-[0.6rem] font-semibold tracking-wider text-primary uppercase">
                  Admin
                </span>
              </Link>
              <div className="flex-1 overflow-y-auto">
                <Suspense fallback={<AdminNav />}>
                  <ActiveAdminNav />
                </Suspense>
              </div>
              <div className="m-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <UserAvatar />
                <Link href="/" className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  View site <ArrowUpRightIcon className="size-3.5" />
                </Link>
                <AdminLogout />
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 md:hidden">
                <Link href="/admin">
                  <Logo />
                </Link>
                <div className="flex items-center gap-3">
                  <Link href="/" className="text-xs text-muted-foreground">
                    View site
                  </Link>
                  <AdminLogout />
                </div>
              </header>
              <div className="shrink-0 border-b border-white/[0.06] md:hidden">
                <Suspense fallback={<AdminNav horizontal />}>
                  <ActiveAdminNav horizontal />
                </Suspense>
              </div>
              <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
          </div>
          <Toaster position="bottom-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
