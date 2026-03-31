import { CrystalbookHero } from "./crystalbook-hero";
import { CrystalbookContent } from "./crystalbook-content";
import { CrystalbookNav } from "./crystalbook-nav";
import { createMetadata } from "@/lib/metadata";
import { CRYSTALBOOK_METADATA } from "@/data/crystalbook";

export const metadata = createMetadata({
  title: `The Crystalbook v${CRYSTALBOOK_METADATA.version} — Eight Laws of System Homeostasis`,
  description:
    "The founding document of AlgoVigilance. Eight Laws derived from the classical moral architecture, translated into systems governance. By Matthew A. Campion, PharmD.",
  path: "/crystalbook",
});

export default function CrystalbookPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <CrystalbookHero />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar Navigation */}
        <div className="lg:col-span-3 relative">
          <CrystalbookNav />
        </div>

        {/* Main Content */}
        <article className="lg:col-span-9">
          <CrystalbookContent />
        </article>
      </div>
    </div>
  );
}
