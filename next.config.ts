import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Enables forbidden() / unauthorized() for server-side admin and account gates.
    authInterrupts: true,
    // Admin image uploads are downscaled in the browser first; 4 MB stays under Vercel's 4.5 MB limit.
    serverActions: { bodySizeLimit: "4mb" },
    agentUpgrade: "security",
  },
  images: {
    remotePatterns: [
      // Clerk avatars (Google / Discord / uploaded)
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
