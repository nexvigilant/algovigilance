
"use client";

import React, { useState, useMemo } from "react";
import { runMicrogram } from "@/lib/pdc/microgram-engine";
import { appeWeekGate } from "@/lib/pdc/appe-micrograms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Info, ArrowRight } from "lucide-react";

export default function AppeTesterPage() {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    appeWeekGate.fields.forEach((f) => {
      initial[f.name] = f.default;
    });
    return initial;
  });

  const result = useMemo(() => {
    return runMicrogram(appeWeekGate, formData);
  }, [formData]);

  const output = result.output as any;

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-2 py-0.5 text-xs font-mono">
            {appeWeekGate.version}
          </Badge>
          <span className="text-muted-foreground text-sm font-medium">{appeWeekGate.chapter_ref}</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{appeWeekGate.title}</h1>
        <p className="text-muted-foreground max-w-2xl text-lg">{appeWeekGate.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Anatomy - The Inputs */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-xl">Anatomy (Inputs)</CardTitle>
            <CardDescription>Adjust scores to see real-time microgram decisions</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {appeWeekGate.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={formData[field.name]?.toString()}
                    onValueChange={(val) => handleInputChange(field.name, parseInt(val))}
                  >
                    <SelectTrigger className="w-full bg-background border-2 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder="Select week..." />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1">
                    <Input
                      id={field.name}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={formData[field.name]}
                      onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value))}
                      className="w-full bg-background border-2 focus:ring-2 focus:ring-primary/20 font-mono text-lg"
                    />
                    <p className="text-xs text-muted-foreground italic">{field.description}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Physiology - The Decision Output */}
        <div className="space-y-6">
          <Card className={`border-2 shadow-md transition-all duration-300 ${output.advance ? 'border-emerald-500 bg-emerald-50/10' : 'border-amber-500 bg-amber-50/10'}`}>
            <CardHeader className="border-b pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Physiology (Output)</CardTitle>
                <Badge 
                  className={`text-sm py-1 px-3 ${
                    output.status === 'PASS' || output.status === 'COMPLETE' 
                      ? 'bg-emerald-600' 
                      : 'bg-amber-600'
                  }`}
                >
                  {output.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-4">
                {output.advance ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-amber-600" />
                )}
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold leading-none">
                    {output.advance ? "Clear to Advance" : "Advancement Blocked"}
                  </h3>
                  <p className="text-muted-foreground">
                    Current Phase: <span className="font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-4">{output.phase}</span>
                  </p>
                </div>
              </div>

              <Alert variant={output.advance ? "default" : "destructive"} className={output.advance ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50 text-amber-900"}>
                {output.advance ? <Info className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                <AlertTitle className="text-lg font-bold">Decision Details</AlertTitle>
                <AlertDescription className="text-base mt-2 opacity-90">
                  {output.message}
                </AlertDescription>
              </Alert>

              {!output.advance && output.remediation && (
                <div className="bg-amber-100/50 p-4 rounded-lg border-2 border-amber-200 shadow-inner">
                  <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest">
                    <ArrowRight className="h-4 w-4" /> Required Remediation (Gap: {output.gap_domain})
                  </h4>
                  <p className="text-amber-800 font-medium">{output.remediation}</p>
                </div>
              )}

              {output.advance && output.next_focus && (
                <div className="bg-emerald-100/50 p-4 rounded-lg border-2 border-emerald-200 shadow-inner">
                  <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest">
                    <ArrowRight className="h-4 w-4" /> Next Focus Area
                  </h4>
                  <p className="text-emerald-800 font-medium">{output.next_focus}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nervous System - The Path */}
          <Card className="border-2 shadow-sm bg-slate-900 text-slate-100">
            <CardHeader className="border-b border-slate-700 py-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2 uppercase tracking-widest text-slate-400">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" /> Nervous System Trace
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3 font-mono text-sm overflow-x-auto">
              <div className="flex flex-wrap items-center gap-2">
                {result.path.map((node, i) => (
                  <React.Fragment key={node}>
                    <span className={`px-2 py-0.5 rounded border ${i === result.path.length - 1 ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                      {node}
                    </span>
                    {i < result.path.length - 1 && <ArrowRight className="h-3 w-3 text-slate-600" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="pt-2 text-slate-500 text-xs">
                Execution Latency: <span className="text-emerald-400">{result.duration_us.toFixed(2)}μs</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
