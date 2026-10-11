import { ImageResponse } from "next/og";
import { isLocale } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/dictionaries";
import { getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { imageDataUri, OG_SIZE, OgFrame, wordmarkDataUri } from "@/lib/og";

export const alt = "Gaminfy";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Share image for a product: its art on the left, name and price on the right. */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : "sr";
  const dict = DICTIONARIES[locale];
  const product = await getProduct(slug, locale);
  const [wordmark, art] = await Promise.all([wordmarkDataUri(), imageDataUri(product?.imageUrl, 420, 525)]);

  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", alignItems: "center", padding: "0 0 0 72px" }}>
          {art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art} alt="" width={392} height={490} style={{ borderRadius: 28, border: "2px solid rgba(255,255,255,0.12)" }} />
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 72px 72px 56px", flex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmark} alt="" width={220} height={32} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#2ee38a", textTransform: "uppercase", letterSpacing: 2 }}>
              {product?.categoryName ?? "Gaminfy"}
            </div>
            <div style={{ marginTop: 16, fontSize: 60, fontWeight: 800, lineHeight: 1.05 }}>{product?.name ?? dict.meta.title}</div>
            {product ? (
              <div style={{ marginTop: 28, display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: "#00140f",
                    background: "#2ee38a",
                    borderRadius: 16,
                    padding: "10px 24px",
                  }}
                >
                  {formatPrice(product.priceMinor, product.currency, locale)}
                </div>
                <div style={{ marginLeft: 20, fontSize: 24, color: "#8eb0a5" }}>
                  {product.deliveryType === "automatic" ? dict.product.instantDelivery : dict.product.teamDelivery}
                </div>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#8eb0a5" }}>{dict.product.secureCheckout.split(".")[0]}</div>
        </div>
      </OgFrame>
    ),
    size,
  );
}
