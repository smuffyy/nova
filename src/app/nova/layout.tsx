import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NovaShell } from "@/components/nova/NovaShell";
import "./nova.css";

const novaSans = Inter({
  subsets: ["latin"],
  variable: "--font-nova",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOVA",
  description: "Your AI business team",
};

export default function NovaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={novaSans.variable}>
      <NovaShell>{children}</NovaShell>
    </div>
  );
}
