import Link from "next/link";
import { Button } from "@/components/ui/button";

export function StatusPage({
  code,
  title,
  text,
  href,
  cta,
}: {
  code: string;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-32 text-center">
      <div aria-hidden className="bg-hero-glow absolute inset-0 -z-10" />
      <p className="text-outline text-[clamp(6rem,22vw,12rem)] leading-none font-extrabold italic">{code}</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-8 h-11 rounded-xl px-6 font-semibold">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}
