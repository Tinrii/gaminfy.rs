import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image src="/brand/gaminfy-symbol-green.svg" alt="" width={28} height={24} priority className="h-6 w-auto" />
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
