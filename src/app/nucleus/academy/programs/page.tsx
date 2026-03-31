import { Suspense } from "react";
import { GraduationCap, Clock, Layers, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BrandedHeroHeader } from "@/components/ui/branded/branded-hero-header";
import { getPublishedPrograms } from "./actions";
import { ProgramsGrid } from "./components/programs-grid";

import { logger } from "@/lib/logger";

const log = logger.scope("programs/page");

export const metadata = {
  title: "Programs | AlgoVigilance Academy",
  description:
    "Structured pharmacovigilance programs with guided module pathways, progressive entrustment, and competency-based assessment.",
};

async function ProgramsContent() {
  try {
    const programs = await getPublishedPrograms();
    return <ProgramsGrid programs={programs} />;
  } catch (error) {
    log.error("Error loading programs:", error);
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertDescription>
          Failed to load programs. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
}

function ProgramsGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-72 rounded-xl bg-nex-surface" />
      ))}
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <BrandedHeroHeader
        label="Structured Learning Experiences"
        title="Academy Programs"
        description="Master pharmacovigilance through guided programs. Each program sequences modules with progressive entrustment — from observation to independent practice."
        icon={GraduationCap}
      >
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-light">
            <BookOpen className="h-4 w-4 text-cyan/70" />
            <span>Module-Based</span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <Layers className="h-4 w-4 text-cyan/70" />
            <span>EPA-Mapped</span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <Clock className="h-4 w-4 text-cyan/70" />
            <span>Competency-Gated</span>
          </div>
        </div>
      </BrandedHeroHeader>

      <Suspense fallback={<ProgramsGridSkeleton />}>
        <ProgramsContent />
      </Suspense>
    </div>
  );
}
