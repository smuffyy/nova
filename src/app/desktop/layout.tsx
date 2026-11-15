import { Outfit } from "next/font/google";
import "./desktop.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-desk",
  weight: ["300", "400", "500", "600", "700"],
});

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`desk-root ${outfit.variable}`}>{children}</div>;
}
