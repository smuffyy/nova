import type { Metadata } from "next";
import {
  Funnel_Display,
  JetBrains_Mono,
  Space_Mono,
  Teko,
} from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Tesla uses Universal Sans (formerly Gotham) — proprietary.
 * Satoshi is the closest freely licensed geometric match.
 * Funnel Display + Space Mono match the Axiom observation-lab face.
 * Teko = La Revoltosa display (condensed, bold uppercase).
 */
const teslaSans = localFont({
  src: [
    { path: "../fonts/satoshi-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/satoshi-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tesla-sans",
  display: "swap",
});

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  variable: "--font-funnel",
  weight: ["400", "500"],
});

const teko = Teko({
  subsets: ["latin"],
  variable: "--font-teko",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MOAC — Made on a Computer",
  description:
    "MOAC is Made on a Computer — company memory you can observe. Chat, Sidekick, Agents, and Digest, grounded in your sources.",
  icons: {
    icon: "/brand/portal-o.png",
    apple: "/brand/portal-mark-512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${teslaSans.variable} ${funnelDisplay.variable} ${teko.variable} ${spaceMono.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <div className="noise" aria-hidden />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
