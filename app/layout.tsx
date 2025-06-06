import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import dynamic from "next/dynamic";
import Script from "next/script";

// Dynamically import the InactivityMonitor with no SSR
const InactivityMonitor = dynamic(
  () => import("@/components/InactivityMonitor"),
  { ssr: false }
);

// Dynamically import the CookieConsent with no SSR
const CookieConsent = dynamic(
  () => import("@/components/CookieConsent").then((mod) => mod.CookieConsent),
  { ssr: false }
);

// Dynamically import GoogleAnalytics with no SSR
const GoogleAnalytics = dynamic(
  () =>
    import("@/components/GoogleAnalytics").then((mod) => mod.GoogleAnalytics),
  { ssr: false }
);

// Dynamically import PageAnalytics with no SSR
const PageAnalytics = dynamic(
  () => import("@/components/PageAnalytics").then((mod) => mod.PageAnalytics),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

// Update the metadata title and description
export const metadata: Metadata = {
  metadataBase: new URL("https://buildxpert.ie"),
  title: {
    default: "BuildXpert - Professional Painting Services",
    template: "%s | BuildXpert",
  },
  description:
    "BuildXpert offers high-quality professional painting services for commercial and residential projects across Ireland with exceptional customer service and attention to detail.",
  keywords: [
    "painting services",
    "professional painters",
    "commercial painting",
    "residential painting",
    "construction services",
    "Ireland",
    "building contractors",
  ],
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://buildxpert.ie",
    title: "BuildXpert - Professional Painting Services",
    description:
      "Professional painting services for commercial and residential projects with attention to detail and client satisfaction.",
    siteName: "BuildXpert",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "BuildXpert - Professional Painting Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildXpert - Professional Painting Services",
    description:
      "Professional painting services for commercial and residential projects with attention to detail and client satisfaction.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://buildxpert.ie",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  generator: "BuildXpert Website",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: {
      url: "/favicon.png",
      type: "image/png",
      sizes: "180x180",
    },
    shortcut: {
      url: "/favicon.png",
      type: "image/png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* Google tag (gtag.js) - For verification only */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-DE3MCE7DKR"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-DE3MCE7DKR', {
                'send_page_view': false // Don't send automatic page views
              });
              // Mark as requiring consent
              gtag('consent', 'default', {
                'analytics_storage': 'denied'
              });
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove Grammarly extension attributes to prevent React warnings
              document.addEventListener('DOMContentLoaded', function() {
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes') {
                      if (mutation.attributeName.startsWith('data-gr-') || 
                          mutation.attributeName.startsWith('data-new-gr-')) {
                        const element = mutation.target;
                        element.removeAttribute(mutation.attributeName);
                      }
                    }
                  });
                });
                
                observer.observe(document.body, {
                  attributes: true,
                  subtree: true,
                  attributeFilter: ['data-gr-ext-installed', 'data-new-gr-c-s-check-loaded']
                });
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Removed direct Google Analytics scripts */}

        <Providers>
          <AuthProvider>
            <Toaster />
            <div className="flex min-h-screen flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <InactivityMonitor />
            <CookieConsent />
            <GoogleAnalytics />
            <PageAnalytics />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
