import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gay Places",
  description:
    "A minimal travel guide helping gay tourists discover LGBTQ+ venues in new cities.",
  icons: {
    icon: "/favicon.png",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <div className="flex min-h-dvh justify-center">
          <div className="w-full max-w-[720px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
