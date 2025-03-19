import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found - BuildXpert",
  description: "Sorry, the page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center min-h-[70vh] py-16 md:py-24">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-muted-foreground">
          Sorry, the page you are looking for doesn&apos;t exist or has been
          moved.
        </p>
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
