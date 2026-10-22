"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Show, useClerk, UserAvatar, useUser } from "@clerk/nextjs";
import { LogOutIcon, MenuIcon, UserCogIcon, UserIcon } from "lucide-react";
import { CartButton } from "@/components/shop/cart-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { LocaleSwitcher, LocaleSwitcherFallback } from "./locale-switcher";
import { Logo } from "./logo";

export function SiteHeader() {
  const { dict, href } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Link href={href("/")} aria-label="Gaminfy" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
          <Suspense fallback={<NavLinks />}>
            <ActiveNavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2">
          <Suspense fallback={<LocaleSwitcherFallback className="hidden sm:inline-flex" />}>
            <LocaleSwitcher className="hidden sm:inline-flex" />
          </Suspense>
          <CartButton />
          <AuthControls />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label={dict.nav.openMenu}>
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[82vw] max-w-sm border-white/[0.06] bg-background">
              <SheetHeader>
                <SheetTitle className="sr-only">{dict.nav.menu}</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
                <Suspense fallback={<NavLinks mobile />}>
                  <ActiveNavLinks mobile onNavigate={() => setOpen(false)} />
                </Suspense>
              </nav>
              <div className="px-4 sm:hidden">
                <Suspense fallback={<LocaleSwitcherFallback />}>
                  <LocaleSwitcher />
                </Suspense>
              </div>
              <Show when="signed-out">
                <div className="mt-auto grid gap-2 p-4">
                  <Button asChild variant="outline" size="lg" className="h-11">
                    <Link href={href("/sign-in")} onClick={() => setOpen(false)}>
                      {dict.nav.login}
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="h-11">
                    <Link href={href("/sign-up")} onClick={() => setOpen(false)}>
                      {dict.nav.register}
                    </Link>
                  </Button>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="mt-auto grid gap-1 border-t border-white/[0.06] p-4">
                  <Link href={href("/profile")} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground">
                    <UserIcon className="size-4" /> {dict.nav.myProfile}
                  </Link>
                  <Link href={href("/profile/account")} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground hover:text-foreground">
                    <UserCogIcon className="size-4" /> {dict.nav.settings}
                  </Link>
                  <LogoutButton className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-destructive hover:bg-destructive/10" />
                </div>
              </Show>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

type NavLinksProps = { mobile?: boolean; pathname?: string; onNavigate?: () => void };

// usePathname() is request data, so it lives behind Suspense; the fallback renders
// the same links without highlighting so the header stays in the static shell.
function ActiveNavLinks(props: Omit<NavLinksProps, "pathname">) {
  return <NavLinks {...props} pathname={stripLocale(usePathname())} />;
}

function NavLinks({ mobile, pathname, onNavigate }: NavLinksProps) {
  const { dict, href } = useI18n();
  const links = [
    { path: "/", label: dict.nav.home },
    { path: "/about", label: dict.nav.about },
    { path: "/marketplace", label: dict.nav.marketplace },
    { path: "/contact", label: dict.nav.contact },
    // Gold, like the CS2 page it opens.
    { path: "/cs2", label: dict.nav.cs2, gold: true },
  ];

  return links.map((item) => {
    const active =
      pathname !== undefined && (item.path === "/" ? pathname === "/" : pathname.startsWith(item.path));
    return (
      <Link
        key={item.path}
        href={href(item.path)}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "transition-colors",
          mobile
            ? "rounded-xl px-3 py-3 text-base"
            : "relative text-sm after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:text-foreground",
          // ("cn" doesn't merge conflicting classes, so the gold link gets its own color branch.)
          item.gold && "font-semibold text-[var(--gold)] drop-shadow-[0_0_10px_rgba(255,192,53,0.35)]",
          item.gold && active && (mobile ? "bg-secondary" : "after:scale-x-100"),
          !item.gold &&
            (active
              ? mobile
                ? "bg-secondary font-semibold text-foreground"
                : "font-semibold text-foreground after:scale-x-100"
              : "text-muted-foreground"),
        )}
      >
        {item.label}
      </Link>
    );
  });
}

function AuthControls() {
  const { dict, href } = useI18n();
  return (
    <>
      <Show when="signed-out">
        <Button
          asChild
          variant="outline"
          className="hidden h-9 border-white/70 bg-transparent px-4 font-medium hover:bg-white hover:text-background sm:inline-flex dark:bg-transparent"
        >
          <Link href={href("/sign-in")}>{dict.nav.login}</Link>
        </Button>
        <Button asChild className="hidden h-9 px-4 font-semibold sm:inline-flex">
          <Link href={href("/sign-up")}>{dict.nav.register}</Link>
        </Button>
      </Show>
      <Show when="signed-in">
        <UserMenu />
      </Show>
    </>
  );
}

function UserMenu() {
  const { dict, href } = useI18n();
  const { user } = useUser();
  const logout = useLogout();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={dict.nav.profile}
        className="grid size-9 place-items-center overflow-hidden rounded-full ring-2 ring-primary/40 transition outline-none hover:ring-primary focus-visible:ring-primary"
      >
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-56 rounded-xl">
        {user && (
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-semibold text-foreground">
              {user.fullName ?? user.username ?? dict.nav.myProfile}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</span>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={href("/profile")}>
            <UserIcon /> {dict.nav.myProfile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={href("/profile/account")}>
            <UserCogIcon /> {dict.nav.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOutIcon /> {dict.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Signs out and returns to the home page in the current language. */
function useLogout() {
  const { href } = useI18n();
  const { signOut } = useClerk();
  return () => signOut({ redirectUrl: href("/") });
}

export function LogoutButton({ className }: { className?: string }) {
  const { dict } = useI18n();
  const logout = useLogout();
  return (
    <button type="button" className={className} onClick={logout}>
      <LogOutIcon className="size-4" /> {dict.nav.logout}
    </button>
  );
}
