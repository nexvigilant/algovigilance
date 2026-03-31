"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, User } from "lucide-react";
import type { AssessorInfo } from "@/lib/pv-report-generator";

interface AssessorFormProps {
  onDownload: (assessor: AssessorInfo) => void;
  disabled?: boolean;
}

/**
 * Assessor Details form — collects user info for PDF personalization + lead capture.
 * Shown after report preview, before download.
 */
export function AssessorForm({ onDownload, disabled }: AssessorFormProps) {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const assessor: AssessorInfo = {
      name: name.trim() || "Anonymous",
      organization: organization.trim() || "Not specified",
      role: role.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    // Fire-and-forget lead capture
    captureReportLead(assessor).catch(() => {
      // Silent — don't block download
    });

    onDownload(assessor);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Personalize Your Report
          </h3>
          <span className="text-[10px] text-zinc-500 ml-auto">
            Optional — download works without details
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="assessor-name" className="text-xs text-zinc-400">
              Your Name
            </Label>
            <Input
              id="assessor-name"
              placeholder="Dr. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assessor-org" className="text-xs text-zinc-400">
              Organization
            </Label>
            <Input
              id="assessor-org"
              placeholder="Pharma Corp Safety Department"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="h-8 text-sm bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assessor-role" className="text-xs text-zinc-400">
              Role
            </Label>
            <Input
              id="assessor-role"
              placeholder="Pharmacovigilance Scientist"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-8 text-sm bg-zinc-900 border-zinc-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assessor-email" className="text-xs text-zinc-400">
              Email
            </Label>
            <Input
              id="assessor-email"
              type="email"
              placeholder="jane@pharma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-sm bg-zinc-900 border-zinc-700"
            />
          </div>
        </div>

        <div className="space-y-1.5 mt-3">
          <Label htmlFor="assessor-notes" className="text-xs text-zinc-400">
            Notes (included in report)
          </Label>
          <Input
            id="assessor-notes"
            placeholder="Routine quarterly signal review for Product X..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-8 text-sm bg-zinc-900 border-zinc-700"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={disabled}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        <Download className="h-4 w-4 mr-2" />
        Download PDF Report
      </Button>
    </form>
  );
}

/** Fire-and-forget lead capture to Firestore via API route */
async function captureReportLead(assessor: AssessorInfo): Promise<void> {
  if (!assessor.email && assessor.name === "Anonymous") return;

  await fetch("/api/report-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...assessor,
      capturedAt: new Date().toISOString(),
      source: "pv-report-download",
    }),
  });
}
