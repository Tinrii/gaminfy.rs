import type { Metadata } from "next";
import { Suspense } from "react";
import { MailIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { listMessages } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toggleMessageHandled } from "../actions";
import { SubmitButton } from "../ui";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Messages />
      </Suspense>
    </div>
  );
}

async function Messages() {
  await requireAdmin();
  const messages = await listMessages();

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
        <MailIcon className="size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No contact messages yet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li
          key={m.id}
          className={cn("rounded-2xl border bg-card p-5", m.isHandled ? "border-white/[0.04] opacity-60" : "border-primary/25")}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{m.name}</p>
              {/* CS2 requests can come with only an Instagram/WhatsApp contact (in the message). */}
              {m.email && (
                <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline">
                  {m.email}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
              <form action={toggleMessageHandled}>
                <input type="hidden" name="id" value={m.id} />
                <SubmitButton variant="outline" className="h-8 rounded-lg text-xs">
                  {m.isHandled ? "Mark unread" : "Mark handled"}
                </SubmitButton>
              </form>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}
