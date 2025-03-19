import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/profile/edit",
        "/__tests__/",
        "/private/",
        "/dashboard/admin/",
      ],
    },
    sitemap: "https://buildxpert.ie/sitemap.xml",
  };
}
