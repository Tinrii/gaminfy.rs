import { ScrollRefresh } from "@/components/motion/scroll-refresh";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Suspense } from "react";

export default function SiteLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
      <ScrollRefresh />
      <Suspense>
        <WhatsAppButton />
      </Suspense>
    </>
  );
}
