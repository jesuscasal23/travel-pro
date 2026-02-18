// ============================================================
// Travel Pro — next-sitemap Configuration
// ============================================================

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://travelpro.app",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/share/", "/dashboard", "/plan", "/trip/", "/onboarding"],
      },
    ],
    additionalSitemaps: [],
  },
  // Exclude authenticated and API routes
  exclude: [
    "/api/*",
    "/share/*",
    "/dashboard",
    "/plan",
    "/trip/*",
    "/onboarding",
    "/profile",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
  // Include all marketing pages
  additionalPaths: async (config) => [
    await config.transform(config, "/"),
    await config.transform(config, "/privacy"),
  ],
  generateIndexSitemap: false,
};
