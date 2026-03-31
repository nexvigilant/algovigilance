import type { Metadata } from "next";
import { BidBoard } from "./components/bid-board";

export const metadata: Metadata = {
  title: "Bid for Consulting Hours",
  description:
    "Bid for PV consulting hours with Matthew Campion, PharmD. Real-time auction — highest bidder wins priority scheduling. Signal detection, causality assessment, regulatory strategy.",
  openGraph: {
    title: "Bid for PV Consulting | AlgoVigilance",
    description:
      "Uber for pharmacovigilance consulting. Bid for expert hours in signal detection, causality, and regulatory strategy.",
  },
};

export default function ConsultingBidPage() {
  return <BidBoard />;
}
