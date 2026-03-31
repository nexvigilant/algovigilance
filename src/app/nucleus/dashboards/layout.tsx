import { NucleusBreadcrumbs } from "@/components/layout/navigation";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "PV Dashboards",
  description:
    "Run complete pharmacovigilance workflows with live data and download professional reports.",
  path: "/nucleus/dashboards",
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
          <NucleusBreadcrumbs className="mb-6" />
          {children}
        </div>
      </main>
    </div>
  );
}
