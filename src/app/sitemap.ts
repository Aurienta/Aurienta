import type { MetadataRoute } from "next";
import { env } from "@/lib/aurienta/env";

const ENTERPRISE_SLUGS = [
  "street-bites",
  "ecopack-solutions",
  "nile-brew-cafe",
  "smartfarm-egypt",
];

/**
 * /sitemap.xml — public surfaces only.
 * Dashboard + API paths are intentionally absent (they require auth / are
 * machine-only).  Built at request time (no ISR) so new enterprise slugs
 * show up immediately.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.publicBaseUrl.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/signin`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/trust`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const enterpriseRoutes: MetadataRoute.Sitemap = ENTERPRISE_SLUGS.map((slug) => ({
    url: `${base}/enterprise/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const badgeRoutes: MetadataRoute.Sitemap = ENTERPRISE_SLUGS.map((slug) => ({
    url: `${base}/badge/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...enterpriseRoutes, ...badgeRoutes];
}
