import { createMetadata } from "@/lib/metadata";
import { NotebookDashboard } from "./components/notebook-dashboard";

export const metadata = createMetadata({
  title: "Notebook Lab",
  description:
    "Manage your Jupyter notebooks — browse sessions, run analyses, export results, and monitor kernel health",
  path: "/nucleus/vigilance/notebooks",
  keywords: [
    "jupyter",
    "notebooks",
    "sessions",
    "analysis",
    "operations",
    "kernels",
  ],
});

export default function NotebooksPage() {
  return <NotebookDashboard />;
}
