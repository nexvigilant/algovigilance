import { createMetadata } from "@/lib/metadata";
import { Bell } from "lucide-react";
import { RegulatoryAlerts } from "./components/regulatory-alerts";

export const metadata = createMetadata({
  title: "Regulatory Alerts",
  description:
    "Real-time FDA safety communications, MedWatch alerts, EMA signals, and drug recalls — pushed to your session via AlgoVigilance Channel.",
  path: "/nucleus/regulatory/alerts",
});

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6">
      <header className="mb-golden-3">
        <div className="mb-golden-2 flex items-center gap-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-400/30 bg-amber-400/5">
            <Bell className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-amber-400/60">
              AlgoVigilance Channel
            </p>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Regulatory Alerts
            </h1>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-golden text-slate-dim/70">
          Live safety communications, recalls, labeling changes, and signal
          updates — monitored continuously and pushed to your Claude Code
          session.
        </p>
      </header>

      <RegulatoryAlerts />
    </div>
  );
}
