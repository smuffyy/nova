import type { Metadata } from "next";
import { PitchSite } from "@/components/PitchSite";
import "./pitch.css";

export const metadata: Metadata = {
  title: "NOVA — Made for operators. Built for the whole company.",
  description:
    "NOVA is an AI operating team for every size of business — specialists for strategy, finance, sales, marketing, operations, and research.",
};

export default function HomePage() {
  return <PitchSite />;
}
