import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "PV Autopilot — Autonomous Drug Safety Intelligence | AlgoVigilance",
  description: "One tool call, complete PV intelligence. Give a drug name and mission, get a full execution plan chaining Station tools ",
}

export default function AutopilotPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          PV Autopilot — Autonomous Drug Safety Intelligence
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          One tool call, complete PV intelligence. Give a drug name and mission, get a full execution plan chaining Station tools into autonomous workflows. Also includes infrastructure gap scanning.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            4 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            autopilot
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
