import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const satoshi = localFont({
  src: [
    { path: "../fonts/satoshi-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tesla-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOVA — Made for operators. Built for the whole company.",
  description:
    "NOVA is an AI operating team for every size of business — specialists for strategy, finance, sales, marketing, operations, and research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={satoshi.variable}>
      <body>{children}</body>
    </html>
  );
}
