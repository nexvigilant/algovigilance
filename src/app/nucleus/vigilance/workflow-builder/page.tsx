import { createMetadata } from "@/lib/metadata";
import { WorkflowBuilder } from "./components/workflow-builder";

export const metadata = createMetadata({
  title: "Workflow Builder",
  description:
    "Design your own safety processing pipeline from PVOS operations — Detect, Triage, Assess, Report, and Review",
  path: "/nucleus/vigilance/workflow-builder",
  keywords: [
    "workflow",
    "pipeline",
    "PVOS",
    "pharmacovigilance",
    "builder",
    "operations",
  ],
});

export default function WorkflowBuilderPage() {
  return <WorkflowBuilder />;
}
