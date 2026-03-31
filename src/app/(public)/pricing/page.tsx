import { createMetadata } from "@/lib/metadata";
import { PricingContent } from "./pricing-content";

export const metadata = createMetadata({
  title: "Free During Beta",
  description:
    "Everything is free. 2,000+ pharmacovigilance tools with no account required. Full portal access is free during our open beta.",
  path: "/pricing",
  imageAlt: "AlgoVigilance — Free During Beta",
});

export default function PricingPage() {
  return <PricingContent />;
}
