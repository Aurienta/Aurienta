import type { Metadata, Viewport } from "next";
import {
  Cairo,
  Cormorant_Garamond,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { RegisterSW } from "@/components/pwa/register-sw";

// Prevent static prerendering during build — all pages are dynamic
// (they query the database at request time, not build time).
export const dynamic = "force-dynamic";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Arabic / RTL typography. Loaded alongside the latin fonts and applied
// via the --font-arabic CSS variable when the document direction is RTL.
const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aurienta.vercel.app"),
  title: "AURIENTA — Constitutional Enterprise Infrastructure",
  description:
    "AURIENTA is a noncustodial constitutional infrastructure of structural trust. It transforms everyday capital into real-economy corporate ownership through digital constitutional rules that cannot be bent, bypassed, or broken. Your capital, your work, your company — no speculation required.",
  keywords: [
    "AURIENTA",
    "Constitutional Enterprise Infrastructure",
    "Zero Custody",
    "AI-enforced governance",
    "Equity Units",
    "Law Firm Client Account",
    "Sovereign Trust Score",
    "Egypt enterprise",
    "real economy ownership",
  ],
  authors: [{ name: "AURIENTA" }],
  creator: "Mohamed Eltonsy",
  publisher: "AURIENTA",
  alternates: {
    canonical: "/",
    languages: { "en": "/", "ar": "/legal" },
  },
  openGraph: {
    title: "AURIENTA — Constitutional Enterprise Infrastructure",
    description:
      "Your capital, your work, your company — no speculation required. The world's first constitutional launchpad.",
    siteName: "AURIENTA",
    type: "website",
    locale: "en_US",
    url: "https://aurienta.vercel.app",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "AURIENTA — Constitutional Enterprise Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AURIENTA — Constitutional Enterprise Infrastructure",
    description:
      "Your capital, your work, your company — no speculation required. The world's first constitutional launchpad.",
    creator: "@aurienta",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  manifest: "/manifest.json",
};

// themeColor + viewport must live in the separate `viewport` export in Next 14+.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#D4AF37" },
    { media: "(prefers-color-scheme: dark)", color: "#060608" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${display.variable} ${inter.variable} ${mono.variable} ${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster />
            <RegisterSW />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
