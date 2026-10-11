import { ImageResponse } from "next/og";
import { isLocale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { imageDataUri, OG_SIZE, OgFrame, wordmarkDataUri } from "@/lib/og";

export const alt = "Gaminfy";
export const size = OG_SIZE;
export const contentType = "image/png";

const COVERS = ["/games/valorant.webp", "/games/fortnite.webp", "/games/pubg.webp"];

/** Default share image for every storefront page without its own. */
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = DICTIONARIES[isLocale(lang) ? lang : "sr"];
  const [wordmark, ...covers] = await Promise.all([wordmarkDataUri(), ...COVERS.map((c) => imageDataUri(c, 300, 375))]);

  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 0 72px 80px", width: 620 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmark} alt="" width={260} height={38} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>{dict.hero.headline.join(" ")}</div>
            <div style={{ marginTop: 24, fontSize: 26, color: "#8eb0a5", lineHeight: 1.4 }}>{dict.hero.subtitle}</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#2ee38a", fontWeight: 700 }}>V-Bucks · Robux · Valorant · Steam · PlayStation</div>
        </div>
        <div style={{ display: "flex", position: "relative", flex: 1 }}>
          {covers.map((src, i) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                width={240}
                height={300}
                style={{
                  position: "absolute",
                  top: [150, 90, 170][i],
                  left: [10, 170, 330][i],
                  borderRadius: 24,
                  border: "2px solid rgba(255,255,255,0.12)",
                  transform: `rotate(${[-8, 0, 7][i]}deg)`,
                  boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
                }}
              />
            ) : null,
          )}
        </div>
      </OgFrame>
    ),
    size,
  );
}
