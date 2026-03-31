import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProgramById, getProgramResources } from "../actions";
import { ProgramDetailClient } from "./components/program-detail-client";

import { logger } from "@/lib/logger";

const log = logger.scope("programs/[programId]");

interface ProgramDetailPageProps {
  params: Promise<{ programId: string }>;
}

export async function generateMetadata({ params }: ProgramDetailPageProps) {
  const { programId } = await params;
  const program = await getProgramById(programId);

  if (!program) {
    return { title: "Program Not Found | AlgoVigilance Academy" };
  }

  return {
    title: `${program.shortName} | AlgoVigilance Academy`,
    description: program.description,
  };
}

async function ProgramDetailContent({ programId }: { programId: string }) {
  try {
    const [program, resources] = await Promise.all([
      getProgramById(programId),
      getProgramResources(programId),
    ]);

    if (!program) {
      notFound();
    }

    return <ProgramDetailClient program={program} resources={resources} />;
  } catch (error) {
    log.error("Error loading program:", error);
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertDescription>
          Failed to load program details. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
}

function ProgramDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-40 bg-nex-surface" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-nex-surface" />
        <Skeleton className="h-12 w-3/4 bg-nex-surface" />
        <Skeleton className="h-6 w-full max-w-3xl bg-nex-surface" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-nex-surface" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-nex-surface" />
        ))}
      </div>
    </div>
  );
}

export default async function ProgramDetailPage({
  params,
}: ProgramDetailPageProps) {
  const { programId } = await params;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Suspense fallback={<ProgramDetailSkeleton />}>
        <ProgramDetailContent programId={programId} />
      </Suspense>
    </div>
  );
}
