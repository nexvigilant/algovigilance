import { createMetadata } from "@/lib/metadata";
import { HelixLab } from "./components/helix-lab";

export const metadata = createMetadata({
  title: "Helix Computing Lab",
  description:
    "Interactive conservation law explorer: ∃ = ∂(×(ς, ∅)). DNA encoding, involutionary transforms, and product health diagnostics.",
  path: "/nucleus/tools/helix-lab",
  keywords: ["helix", "conservation", "DNA", "involution", "mutualism"],
});

export default function HelixLabPage() {
  return <HelixLab />;
}
