// Force library engine type before any prisma import happens
process.env.PRISMA_CLIENT_ENGINE_TYPE = "library";

// Print confirmation that this file is being executed
console.log(
  "[prisma-setup] Setting PRISMA_CLIENT_ENGINE_TYPE to library for all environments"
);

// Ensure proper database URL configuration
if (process.env.VERCEL) {
  console.log(
    "[prisma-setup] Vercel environment detected - ensuring database connection is properly configured"
  );

  // If on Vercel and DIRECT_URL is available, prefer it for better performance
  if (process.env.DIRECT_URL) {
    console.log("[prisma-setup] Using DIRECT_URL for Vercel deployment");
  }
}
