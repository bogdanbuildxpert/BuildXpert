import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import dynamic from "next/dynamic";

// Dynamically import the InactivityMonitor with no SSR
const InactivityMonitor = dynamic(
  () => import("@/components/InactivityMonitor"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

// Update the metadata title and description
export const metadata: Metadata = {
  title: "BuildXpert - Construction Expertise",
  description: "Professional construction and building services by BuildXpert",
  generator: "v0.dev",
  icons: {
    icon: {
      url: "/favicon.svg",
      type: "image/svg+xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
        <Providers>
          <AuthProvider>
            <NotificationsProvider>
              <Toaster position="top-right" />
              <div className="flex min-h-screen flex-col">
                <Navigation />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <InactivityMonitor />
            </NotificationsProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
