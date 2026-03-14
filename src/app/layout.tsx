import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Gay Places",
  description:
    "A minimal travel guide helping gay tourists discover LGBTQ+ venues in new cities.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Gay Places",
    description:
      "A minimal travel guide helping gay tourists discover LGBTQ+ venues in new cities.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gay Places",
    description:
      "A minimal travel guide helping gay tourists discover LGBTQ+ venues in new cities.",
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
      </body>
    </html>
  );
}
