import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHero({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative isolate overflow-hidden pt-[4.5rem]", className)}>
      <div aria-hidden className="bg-hero-glow absolute inset-0 -z-10" />
      <div className="container-page pt-12 pb-8 sm:pt-16">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {Icon && <Icon className="size-7 text-primary" aria-hidden />}
          {title}
        </h1>
        {children && <div className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{children}</div>}
      </div>
    </section>
  );
}
