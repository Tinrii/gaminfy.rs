"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { stripLocale } from "@/i18n/config";
import { WHATSAPP_NUMBER } from "@/lib/site";

/** Pages where the floating chat button would get in the way. */
const HIDDEN_ON = ["/profile"];

/**
 * Floating "chat on WhatsApp" button. Opens the WhatsApp app on phones and
 * WhatsApp Web on desktop, with a short greeting already typed in.
 * Reads the URL, so it must render inside <Suspense>.
 */
export function WhatsAppButton() {
  const { dict } = useI18n();
  const pathname = stripLocale(usePathname());
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(dict.whatsapp.message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.whatsapp.label}
      className="group fixed right-4 bottom-4 z-40 flex h-14 items-center gap-0 rounded-full bg-[#25D366] pr-4 pl-4 text-white shadow-[0_12px_32px_-8px_rgba(37,211,102,0.55)] transition-[gap,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:gap-2.5 hover:shadow-[0_16px_40px_-8px_rgba(37,211,102,0.7)] focus-visible:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-6 shrink-0">
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8h-.1a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.4 4.6Zm8.4-18.2A11.8 11.8 0 0 0 1.9 17.8L.2 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4h.1A11.8 11.8 0 0 0 20.4 3.6Z" />
      </svg>
      <span className="max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-[max-width] duration-300 group-hover:max-w-56 group-focus-visible:max-w-56">
        {dict.whatsapp.label}
      </span>
    </a>
  );
}
