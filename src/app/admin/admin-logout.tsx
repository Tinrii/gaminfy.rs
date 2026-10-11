"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOutIcon } from "lucide-react";

export function AdminLogout() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      aria-label="Log out"
      title="Log out"
      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOutIcon className="size-4" />
    </button>
  );
}
