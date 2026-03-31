import { Metadata } from "next"
import { EfficacyDashboard } from "./components/efficacy-dashboard"

export const metadata: Metadata = {
  title: "Anti-Vector Efficacy Tracker | AlgoVigilance",
  description: "Real-time PRR time series for tracked drug-event signals. Monitors anti-vector effectiveness by tracking disproportionality movement over time.",
}

export default function EfficacyTrackerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Anti-Vector Efficacy Tracker
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Autonomous nightly monitoring of drug safety signals. Tracks PRR movement
          over time to measure whether deployed anti-vectors are working. Correlates
          label changes with signal trends.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            autonomous
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            nightly at 22:07
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            3 drugs, 11 signals
          </span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Tracked Drugs</div>
          <div className="mt-1 text-2xl font-bold">3</div>
          <div className="text-xs text-muted-foreground">semaglutide, tirzepatide, metformin</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Active Signals</div>
          <div className="mt-1 text-2xl font-bold">11</div>
          <div className="text-xs text-muted-foreground">GLP-1 class + biguanide comparator</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Cron Schedule</div>
          <div className="mt-1 text-2xl font-bold">22:07 / 22:37</div>
          <div className="text-xs text-muted-foreground">efficacy tracker / label drift monitor</div>
        </div>
      </div>

      <EfficacyDashboard />
    </div>
  )
}
