import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "@/styles/index.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { OrganizationSchema, WebsiteSchema } from "@/components/shared/seo";
import { ConsentGatedAnalytics } from "@/components/shared/analytics/consent-gated-analytics";
import { ClientWidgets } from "@/components/client-widgets";
import { CookieConsentBanner } from "@/components/shared/banners";
import { SecurityHardening } from "@/components/shared/security";
import { JsReadyMarker } from "@/components/js-ready-marker";
import { WebVitalsReporter } from "@/lib/web-vitals";
import { SITE_CONFIG } from "@/lib/constants/urls";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || SITE_CONFIG.url),
  title: "AlgoVigilance",
  description: "Financial analytics monitoring — algorithmic safety for markets.",
};

// Self-hosted fonts — eliminates build-time Google Fonts fetch dependency
const inter = localFont({
  src: "../../public/fonts/inter-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  preload: true,
  weight: "100 900",
});
const spaceGrotesk = localFont({
  src: "../../public/fonts/space-grotesk-latin.woff2",
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
  weight: "300 700",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        {/* next/font/google self-hosts fonts — no googleapis preconnect needed */}
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-body antialiased`}
        suppressHydrationWarning
      >
        {/* Skip link removed from root layout - handled by page wrappers to prevent duplicates */}
        <SecurityHardening />
        <JsReadyMarker />
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <ClientWidgets />
          <CookieConsentBanner />
        </AuthProvider>
        <ConsentGatedAnalytics />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
