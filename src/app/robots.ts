import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Private and transactional pages carry no search value.
  const privatePaths = ["/admin", "/api/", "/profile", "/orders", "/sign-in", "/sign-up"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...privatePaths, ...privatePaths.filter((p) => !p.startsWith("/admin") && !p.startsWith("/api")).map((p) => `/en${p}`)],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
