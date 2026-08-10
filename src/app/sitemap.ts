import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://aurienta.vercel.app";
  const lastModified = new Date();

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/signin`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/register`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/registry`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/trust`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/legal`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
