import { PipelineStudio } from "./components/pipeline-studio";

export const metadata = {
  title: "Signal Pipeline | AlgoVigilance Vigilance",
  description:
    "Run end-to-end signal detection — upload data, detect signals, review results",
};

export default function PipelinePage() {
  return <PipelineStudio />;
}
