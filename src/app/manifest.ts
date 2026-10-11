import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gaminfy — Dopune, poklon kartice i nalozi za igre",
    short_name: "Gaminfy",
    description: "V-Bucks, Robux, Valorant Points, Steam i PlayStation poklon kartice, nalozi i pretplate.",
    start_url: "/",
    display: "standalone",
    background_color: "#001613",
    theme_color: "#001613",
    lang: "sr-Latn",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
