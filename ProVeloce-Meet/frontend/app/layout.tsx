import { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { Roboto } from "next/font/google";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthHeader from "@/components/AuthHeader";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClerkProviderClient from "@/components/ClerkProviderClient";
import { ThemeProvider, ThemeScript } from "@/providers/ThemeProvider";

// Use Roboto font (Google's standard font, similar to Google Sans)
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ProVeloce Meet",
    template: "%s | ProVeloce Meet",
  },
  description: "Professional video conferencing software for businesses. Host secure online meetings with real-time collaboration, meeting recording, and participant analytics. Browser-based WebRTC solution.",
  keywords: [
    "secure online meeting platform",
    "real-time video calling app",
    "business video conferencing software",
    "remote collaboration tool",
    "host controlled meeting system",
    "browser-based WebRTC solution",
    "meeting recording and history tracking",
    "cloud meeting dashboard",
    "participant attendance analytics",
  ],
  authors: [{ name: "ProVeloce" }],
  creator: "ProVeloce",
  publisher: "ProVeloce",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://meet.proveloce.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://meet.proveloce.com",
    siteName: "ProVeloce Meet",
    title: "ProVeloce Meet - Secure Online Meeting Platform",
    description: "Professional video conferencing software for businesses. Host secure online meetings with real-time collaboration.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProVeloce Meet - Secure Online Meeting Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProVeloce Meet - Secure Online Meeting Platform",
    description: "Professional video conferencing software for businesses.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icons/ProMeet.png",
    apple: "/icons/ProMeet.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const clerkAppearance = {
    layout: {
      socialButtonsVariant: "iconButton" as const,
      logoImageUrl: "/icons/ProMeet.png",
    },
    variables: {
      colorText: "#202124",
      colorPrimary: "#1A73E8",
      colorBackground: "#FFFFFF",
      colorInputBackground: "#F8F9FA",
      colorInputText: "#202124",
    },
  };

  return (
    <ClerkProviderClient appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <ThemeScript />
        </head>
        <body className={`${roboto.variable} ${roboto.className} bg-light-2 text-text-primary`}>
          {/* Define __pcPlatform before copilot script loads to prevent "PC plat undefined" error */}
          <Script
            id="pc-platform-init"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.__pcPlatform = navigator.userAgent || "web";`,
            }}
          />
          {/* Warn if using production Clerk keys on localhost */}
          <Script
            id="clerk-localhost-warning"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.') ||
                    window.location.hostname.startsWith('10.') ||
                    window.location.hostname.startsWith('172.');
                  const publishableKey = '${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''}';
                  const isProductionKey = publishableKey.startsWith('pk_live_');
                  const disableDomain = '${process.env.NEXT_PUBLIC_DISABLE_CLERK_DOMAIN || ''}' === 'true';
                  
                  if (isLocalhost && isProductionKey && !disableDomain) {
                    console.warn(
                      '⚠️ Clerk Production Keys on Localhost:\\n' +
                      'You are using production Clerk keys (pk_live_...) on localhost.\\n' +
                      'Production keys are restricted to the configured domain (meet.proveloce.com).\\n\\n' +
                      'Solutions:\\n' +
                      '1. Use development keys (pk_test_...) for localhost development\\n' +
                      '2. Set NEXT_PUBLIC_DISABLE_CLERK_DOMAIN=true in your .env.local file\\n' +
                      '3. Configure Clerk dashboard to allow localhost as an allowed origin'
                    );
                  }
                })();
              `,
            }}
          />
          <ErrorBoundary>
            <ThemeProvider>
              <Toaster />
              {children}
            </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProviderClient>
  );
}
