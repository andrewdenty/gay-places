import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfb" },
    { media: "(prefers-color-scheme: dark)",  color: "#171717" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co",
  ),
  title: {
    default:
      "Gay Places | A Curated Guide to Gay Bars, Clubs and Other Spaces",
    template: "%s | Gay Places",
  },
  description:
    "A quietly curated guide to gay bars, clubs and queer spaces around the world. Explore city guides and distinctive venues chosen for atmosphere, character and cultural relevance.",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: [
      { url: "/icons/icon-180.png" },
      { url: "/icons/icon-180-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
  appleWebApp: {
    title: "Gay Places",
  },
  openGraph: {
    title: {
      default:
        "Gay Places | A Curated Guide to Gay Bars, Clubs and Other Spaces",
      template: "%s | Gay Places",
    },
    description:
      "A quietly curated guide to gay bars, clubs and queer spaces around the world. Explore city guides and distinctive venues chosen for atmosphere, character and cultural relevance.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Gay Places | A Curated Guide to Gay Bars, Clubs and Other Spaces",
    description:
      "A quietly curated guide to gay bars, clubs and queer spaces around the world. Explore city guides and distinctive venues chosen for atmosphere, character and cultural relevance.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
