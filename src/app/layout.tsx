import type { Metadata } from "next";
import { Inter, Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const goodSans = Inter({
  variable: "--font-good-sans",
  subsets: ["latin"],
});

const redaction = Fraunces({
  variable: "--font-redaction",
  subsets: ["latin"],
  weight: ["300", "600", "700"],
});

const sui = Space_Grotesk({
  variable: "--font-sui",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "ShopMind",
  description: "AI destekli moda keşif ve alışveriş deneyimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${goodSans.variable} ${redaction.variable} ${sui.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
