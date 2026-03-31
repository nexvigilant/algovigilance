import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "PV Dashboards — Run Live Pharmacovigilance Workflows",
  description:
    "Run complete pharmacovigilance workflows with live FDA, NIH, and NLM data. Signal detection, causality assessment, benefit-risk analysis. Download professional reports. Powered by AlgoVigilance Station.",
  path: "/dashboards",
});

export default function DashboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <main className="min-w-0">
        <div className="container mx-auto px-4 py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
