import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * Loads a site image (/games/…) or remote one (R2) as a PNG data URI —
 * the OG renderer can't decode WebP, so everything goes through sharp first.
 */
export async function imageDataUri(src: string | null | undefined, width: number, height: number): Promise<string | null> {
  if (!src) return null;
  try {
    const input = src.startsWith("/")
      ? await readFile(path.join(process.cwd(), "public", src))
      : Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(5000) })).arrayBuffer());
    const png = await sharp(input).resize(width, height, { fit: "cover", position: "top" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function wordmarkDataUri(): Promise<string> {
  const svg = await readFile(path.join(process.cwd(), "public", "brand", "gaminfy-wordmark-white.svg"));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

/** Shared dark-green canvas with the brand glow. */
export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#001613",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(7,158,79,0.35), transparent 55%), radial-gradient(circle at 0% 100%, rgba(46,227,138,0.12), transparent 50%)",
        color: "#f1f7f4",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </div>
  );
}
