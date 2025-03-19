import { MetadataRoute } from "next";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://buildxpert.ie";

  // Get current date for lastModified
  const currentDate = new Date();

  // Define standard pages
  const standardPages = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: currentDate,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/post-job`,
      lastModified: currentDate,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly" as ChangeFrequency,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly" as ChangeFrequency,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: "yearly" as ChangeFrequency,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: "yearly" as ChangeFrequency,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: currentDate,
      changeFrequency: "monthly" as ChangeFrequency,
      priority: 0.4,
    },
  ];

  // You could also dynamically generate URLs for blog posts, service pages, etc.
  // Example:
  /*
  const blogPosts = await getBlogPosts();
  const blogPages = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.lastUpdated),
    changeFrequency: 'monthly' as ChangeFrequency,
    priority: 0.7,
  }));
  */

  return [
    ...standardPages,
    // ...blogPages, // uncommend when you add a blog
  ];
}
