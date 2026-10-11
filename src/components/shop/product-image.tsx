import Image, { type ImageProps } from "next/image";

/**
 * Local images (/games/...) go through the optimizer; external URLs an admin pastes
 * are rendered as-is so we don't need to allow every host in next.config.
 */
export function ProductImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string | null }) {
  const resolved = src || "/brand/gaminfy-icon-3d.svg";
  return <Image src={resolved} alt={alt} unoptimized={!resolved.startsWith("/")} {...props} />;
}
