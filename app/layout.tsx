import type { Metadata, Viewport } from "next";
import { Archivo, Schibsted_Grotesk } from "next/font/google";

import { getActiveProfile, resolveLook } from "@/lib/profile";

import "./globals.css";
import { LookProvider } from "./look-context";
import { ThemeColorSync } from "./theme-color-sync";
import { ThemeProvider } from "./theme-provider";

// One family per look (see app/globals.css): Archivo with its width axis,
// so Tailor's navy can set headings expanded like a woven garment label,
// and Schibsted Grotesk for Colour story's dense, gallery-style type.
// Browsers only download the face the current look actually uses.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wardro",
  applicationName: "Wardro",
  description: "AI-powered outfit generator and digital wardrobe.",
  // Opens full-screen (no Safari toolbar) when added to an iPhone/iPad
  // home screen; the manifest (app/manifest.ts) does the same elsewhere.
  appleWebApp: {
    capable: true,
    title: "Wardro",
    statusBarStyle: "default",
  },
  // Next emits only the standard `mobile-web-app-capable`; older iOS
  // versions still look for Apple's original name.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6eaef" },
    { media: "(prefers-color-scheme: dark)", color: "#111925" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Lay out edge to edge so env(safe-area-inset-*) is reported -- the
  // bottom nav pads itself above the iPhone home indicator.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolved server-side so the first paint is already in the right look.
  const look = await resolveLook(await getActiveProfile());

  return (
    <html
      lang="en"
      data-look={look}
      suppressHydrationWarning
      className={`${archivo.variable} ${schibsted.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-ink antialiased">
        <ThemeProvider>
          <LookProvider look={look}>
            <ThemeColorSync />
            {children}
          </LookProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
