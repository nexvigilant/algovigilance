import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "AIP Fleet Command | AlgoVigilance",
  description: "Autonomous Intelligence Program fleet status. 10 AIPs across code health, microgram patrol, station watchdog, dependency",
}

export default function DaemonPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AIP Fleet Command
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Autonomous Intelligence Program fleet status. 10 AIPs across code health, microgram patrol, station watchdog, dependency scanning, knowledge decay, brain hygiene, skill entropy, hook health, git hygie
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            6 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            daemon
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
