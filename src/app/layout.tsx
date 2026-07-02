import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "秒で日本史",
  description: "止めた秒が、そのまま西暦になる。",
  openGraph: {
    title: "秒で日本史",
    description: "止めた秒が、そのまま西暦になる。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "秒で日本史",
    description: "止めた秒が、そのまま西暦になる。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${outfit.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
