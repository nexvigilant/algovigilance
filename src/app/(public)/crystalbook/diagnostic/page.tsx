import { createMetadata } from "@/lib/metadata";
import { DiagnosticWizard } from "./diagnostic-wizard";

export const metadata = createMetadata({
  title: "Crystalbook Diagnostic — System Health Assessment",
  description:
    "Assess any system against the Eight Laws of System Homeostasis. Identify which laws are being violated and what corrections are needed. Free, instant, based on The Crystalbook by Matthew A. Campion, PharmD.",
  path: "/crystalbook/diagnostic",
});

export default function CrystalbookDiagnosticPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <DiagnosticWizard />
      </div>
    </div>
  );
}
