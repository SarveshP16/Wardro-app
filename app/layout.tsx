import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";
import { ServiceWorkerRegistration } from "./service-worker-registration";
import { ThemeProvider } from "./theme-provider";

// Wardro's font pairing, ported from app_typography.dart: Fraunces (a
// warm, slightly quirky serif) for headings/brand moments, Manrope (a
// clean geometric sans) for body copy and UI chrome.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wardro",
  description: "AI-powered outfit generator and digital wardrobe.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wardro",
  },
};

export const viewport: Viewport = {
  themeColor: "#b2532d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${manrope.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
