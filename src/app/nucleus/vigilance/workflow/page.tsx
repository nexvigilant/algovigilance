import { WorkflowNavigator } from "./components/workflow-navigator";
import { GitFork } from "lucide-react";

export const metadata = {
  title: "PV Workflow Navigator | AlgoVigilance Vigilance",
  description:
    "Not sure where to start in pharmacovigilance? Answer two questions and get your personalized workflow path.",
};

export default function WorkflowPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
            <GitFork className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
              AlgoVigilance Vigilance
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Where Do I Start?
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Answer two quick questions and we&apos;ll show you exactly which PV
          tool to use first — and what comes next.
        </p>
      </header>

      <WorkflowNavigator />
    </div>
  );
}
