import { createMetadata } from "@/lib/metadata";
import { PrimitivePhysics } from "./components/primitive-physics";

export const metadata = createMetadata({
  title: "Where Do the Laws of Physics Come From?",
  description:
    "Six informational axioms derive both Einstein's E=mc\u00B2 and the Schr\u00F6dinger equation — the same axioms that power AlgoVigilance signal detection",
  path: "/nucleus/vigilance/primitive-physics",
  keywords: [
    "Lex Primitiva",
    "E=mc2",
    "conservation law",
    "information ontology",
    "pharmacovigilance foundations",
    "primitive physics",
  ],
});

export default function PrimitivePhysicsPage() {
  return <PrimitivePhysics />;
}
