"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderTreeIcon, LayoutDashboardIcon, MailIcon, PackageIcon, ReceiptTextIcon, TicketPercentIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/admin/orders", label: "Orders", icon: ReceiptTextIcon },
  { href: "/admin/products", label: "Products", icon: PackageIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderTreeIcon },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercentIcon },
  { href: "/admin/messages", label: "Messages", icon: MailIcon },
];

type Props = { horizontal?: boolean };

/** Highlights the current section; must render inside Suspense (usePathname is request data). */
export function ActiveAdminNav(props: Props) {
  return <AdminNav {...props} pathname={usePathname()} />;
}

export function AdminNav({ pathname, horizontal }: Props & { pathname?: string }) {
  const isActive = (href: string) =>
    pathname !== undefined && (href === "/admin" ? pathname === href : pathname.startsWith(href));

  if (horizontal) {
    return (
      <nav aria-label="Admin" className="scrollbar-none flex gap-6 overflow-x-auto px-4">
        {ITEMS.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative shrink-0 py-3 text-sm transition-colors",
                active
                  ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Admin" className="px-3 py-4">
      <p className="px-3 pb-3 text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">Menu</p>
      <ul className="space-y-0.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg border transition-colors",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-white/[0.06] bg-white/[0.02] group-hover:border-white/15 group-hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
