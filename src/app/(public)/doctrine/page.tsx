import { FileText } from "lucide-react";
import { DoctrineContent } from "./doctrine-content";
import { DoctrineNav } from "./doctrine-nav";
import { PageHero } from "@/components/marketing";
import { createMetadata } from "@/lib/metadata";
import { DOCTRINE_METADATA } from "@/data/doctrine";

export const metadata = createMetadata({
  title: `The AlgoVigilance Doctrine v${DOCTRINE_METADATA.version}`,
  description: `Version ${DOCTRINE_METADATA.version}: The principles that define how we work, what we stand for, and how we protect patient safety.`,
  path: "/doctrine",
});

export default function DoctrinePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <PageHero
        title="The AlgoVigilance Doctrine"
        icon={
          <FileText
            className="w-10 h-10 md:w-12 md:h-12 text-cyan"
            aria-hidden="true"
          />
        }
      >
        <p className="text-sm text-slate-dim text-center mt-4">
          Version {DOCTRINE_METADATA.version} | Effective Date:{" "}
          {DOCTRINE_METADATA.adopted}
        </p>
      </PageHero>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar Navigation */}
        <div className="lg:col-span-3 relative">
          <DoctrineNav />
        </div>

        {/* Main Content - uses <article> to avoid nested <main> with PublicPageWrapper */}
        <article className="lg:col-span-9">
          <DoctrineContent />
        </article>
      </div>
    </div>
  );
}
