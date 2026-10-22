import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {/* The symbol is painted with the brand tokens (green, or gold on the CS2 page) through its shape as a mask. */}
      <span
        aria-hidden
        className="h-6 w-[1.76rem] bg-[linear-gradient(to_right,var(--brand-deep),var(--brand))] [mask:url(/brand/gaminfy-symbol-white.svg)_center/contain_no-repeat]"
      />
      <Image
        src="/brand/gaminfy-wordmark-white.svg"
        alt="Gaminfy"
        width={130}
        height={19}
        priority
        className="h-[1.05rem] w-auto"
      />
    </span>
  );
}
