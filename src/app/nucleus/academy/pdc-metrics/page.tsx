import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { BrandedHeroHeader } from "@/components/ui/branded/branded-hero-header";
import { PdcMetricsDashboard } from "./components/pdc-metrics-dashboard";

export const metadata: Metadata = {
  title: "PDC Metrics Framework | AlgoVigilance Academy",
  description:
    "108 strategic metrics across 17 categories measuring the Pharmacovigilance Professional Development Continuum. 4-stakeholder dashboards: Executive, Operational, Academic, Participant.",
};

export default function PdcMetricsPage() {
  return (
    <div className="space-y-8">
      <BrandedHeroHeader
        icon={BarChart3}
        label="Metrics"
        title="PDC Metrics Framework"
        description="108 strategic metrics across 17 categories. Complete measurement for the Pharmacovigilance Professional Development Continuum."
      />
      <PdcMetricsDashboard />
    </div>
  );
}
