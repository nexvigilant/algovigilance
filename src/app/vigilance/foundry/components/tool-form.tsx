"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ToolFormProps {
  toolName: string
  params: { name: string; type: string; description: string; required: boolean }[]
}

export function ToolForm({ toolName, params }: ToolFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      // Call via pv-compute client-side or API route
      const res = await fetch("/api/station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: `foundry_nexvigilant_com_${toolName.replace(/-/g, "_")}`,
          args: values,
        }),
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setResult(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{toolName.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {params.map((p) => (
          <div key={p.name} className="space-y-1">
            <Label htmlFor={p.name}>
              {p.name} {p.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={p.name}
              placeholder={p.description}
              value={values[p.name] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Running..." : "Execute"}
        </Button>
        {result && (
          <pre className="mt-4 p-4 bg-muted rounded-md text-xs overflow-auto max-h-96">
            {result}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
