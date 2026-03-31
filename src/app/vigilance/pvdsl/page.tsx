import { Metadata } from "next"
import { ToolCards } from "./components/tool-cards"

export const metadata: Metadata = {
  title: "PVDSL — Pharmacovigilance Domain-Specific Language | AlgoVigilance",
  description: "Compile, evaluate, parse, and introspect PVDSL expressions. PVDSL provides a domain-focused scripting language for signa",
}

export default function PvdslPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          PVDSL — Pharmacovigilance Domain-Specific Language
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Compile, evaluate, parse, and introspect PVDSL expressions. PVDSL provides a domain-focused scripting language for signal detection (PRR, ROR, IC, EBGM), causality assessment (Naranjo, WHO-UMC), strin
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            4 tools
          </span>
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            pvdsl
          </span>
        </div>
      </div>
      <ToolCards />
    </div>
  )
}
