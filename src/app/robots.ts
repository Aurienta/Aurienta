import type { MetadataRoute } from "next";

/**
 * /robots.txt
 * Public surfaces are crawlable; the authenticated dashboard and the entire
 * API surface are off-limits to spiders.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/signin", "/register"],
      },
    ],
    sitemap: "/sitemap.xml",
    host: "https://aurienta.eg",
  };
}
