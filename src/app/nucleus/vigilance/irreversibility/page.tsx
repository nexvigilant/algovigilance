import { createMetadata } from "@/lib/metadata";
import { IrreversibilityExplorer } from "./components/irreversibility-explorer";

export const metadata = createMetadata({
  title: "Can You Undo This?",
  description:
    "Understand which pharmacovigilance actions are reversible, conditional, or irreversible — and how much time you have before the point of no return",
  path: "/nucleus/vigilance/irreversibility",
  keywords: [
    "irreversibility",
    "regulatory deadline",
    "point of no return",
    "pharmacovigilance",
    "ICSR submission",
    "compliance",
  ],
});

export default function IrreversibilityPage() {
  return <IrreversibilityExplorer />;
}
