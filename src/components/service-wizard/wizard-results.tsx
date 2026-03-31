'use client';

/**
 * Strategic Diagnostic Assessment - Results Screen
 *
 * Displays personalized diagnostic findings based on user's answers.
 * Includes lead capture form for downloading the full Strategic Intervention Report.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  FileText,
  Download,
  Loader2,
  User,
  Building2,
  Mail,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WizardRecommendations, WizardBranch } from '@/types/service-wizard';
import { ServiceCard } from './service-card';
import type { WizardReportInput } from '@/app/api/wizard-report/route';

import { logger } from '@/lib/logger';
const log = logger.scope('wizard-results');

interface WizardResultsProps {
  recommendations: WizardRecommendations;
  branch: WizardBranch;
  scores: Record<string, number>;
  tags: string[];
  onBookCall: () => void;
  onStartOver: () => void;
}

// =============================================================================
// Client-Side Maturity Chart (SVG Radar)
// =============================================================================

function MaturityChart({ scores }: { scores: Record<string, number> }) {
  const categories: { key: string; label: string }[] = [
    { key: 'strategic', label: 'Strategic' },
    { key: 'innovation', label: 'Innovation' },
    { key: 'tactical', label: 'Tactical' },
    { key: 'talent', label: 'Talent' },
    { key: 'technology', label: 'Technology' },
  ];

  const size = 300;
  const center = size / 2;
  const radius = center - 40;
  const numPoints = categories.length;
  const angleStep = (Math.PI * 2) / numPoints;

  // Calculate points for the data polygon
  const points = categories.map((cat, i) => {
    const score = scores[cat.key] || 0;
    const r = (Math.min(100, score * 20) / 100) * radius;
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  });

  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-nex-dark/30 rounded-2xl border border-nex-light/50">
      <svg width={size} height={size} className="overflow-visible" role="img" aria-label="Maturity benchmark chart showing scores across Strategic, Innovation, Tactical, Talent, and Technology domains">
        {/* Web Grid */}
        {[0.25, 0.5, 0.75, 1].map((factor) => {
          const r = radius * factor;
          const gridPoints = Array.from({ length: numPoints }).map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
          }).join(' ');
          return (
            <polygon
              key={factor}
              points={gridPoints}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axes */}
        {categories.map((cat, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          const lx = center + Math.cos(angle) * (radius + 20);
          const ly = center + Math.sin(angle) * (radius + 20);

          return (
            <g key={cat.key}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
              <text
                x={lx}
                y={ly}
                fill="rgba(255,255,255,0.5)"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono uppercase tracking-tighter"
              >
                {cat.label}
              </text>
            </g>
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={pointsStr}
          fill="rgba(0, 229, 255, 0.2)"
          stroke="#00e5ff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#00e5ff"
            className="drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]"
          />
        ))}
      </svg>
      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyan/60 uppercase tracking-widest">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        Maturity Benchmark Profile
      </div>
    </div>
  );
}

export function WizardResults({
  recommendations,
  branch,
  scores,
  tags,
  onBookCall,
  onStartOver,
}: WizardResultsProps) {
  const { primary, secondary, personalizedMessage, situationSummary } = recommendations;

  // Form state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    if (!company.trim()) {
      errors.company = 'Organization is required';
    } else if (company.trim().length < 3) {
      errors.company = 'Organization must be at least 3 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!email.includes('@') || !email.includes('.')) {
      errors.email = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = name.trim().length > 2 && company.trim().length > 2 && email.includes('@');

  // Handle download
  const handleDownloadReport = async () => {
    setHasAttemptedSubmit(true);
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data for API
      const reportData: WizardReportInput = {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        branch,
        scores,
        primaryCategory: primary.category,
        secondaryCategories: secondary.map((s) => s.category),
        tags,
        situationSummary,
        personalizedMessage,
      };

      // Save to Firestore and generate PDF via API
      const response = await fetch('/api/wizard-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate diagnostic report');
      }

      const { reportId, downloadUrl: url } = await response.json();
      log.info('Diagnostic report generated:', { reportId, hasUrl: !!url });

      if (url) {
        setDownloadUrl(url);
        setDownloadComplete(true);

        // Auto-trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `AlgoVigilance-Strategic-Diagnostic-${name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('PDF generation failed - please try again');
      }
    } catch (err) {
      log.error('Failed to download report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate diagnostic report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-mono uppercase tracking-widest mb-4">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Diagnostic Analysis Complete
        </div>

        <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-4 uppercase tracking-tight">
          {personalizedMessage}
        </h2>

        <p className="text-slate-dim text-lg leading-relaxed">{situationSummary}</p>
      </div>

      {/* Benchmarking Visualization */}
      <div className="mb-12">
        <MaturityChart scores={scores} />
      </div>

      {/* Primary Recommendation */}
      <div className="mb-8">
        <h3 className="text-xs font-mono uppercase tracking-widest text-cyan mb-4">
          Priority Strategic Imperative
        </h3>
        <ServiceCard recommendation={primary} isPrimary />
      </div>

      {/* Secondary Recommendations */}
      {secondary.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-dim mb-4">
            Concurrent Operational Mandates
          </h3>
          <div className="grid gap-4">
            {secondary.map((rec) => (
              <ServiceCard key={rec.category} recommendation={rec} isPrimary={false} />
            ))}
          </div>
        </div>
      )}

      {/* Lead Capture / Report Download Section */}
      <div className="p-8 rounded-2xl bg-nex-surface border border-nex-light shadow-2xl shadow-black/40 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5" aria-hidden="true">
           <FileText className="h-32 w-32" />
        </div>

        <div className="flex items-start gap-5 mb-8 relative z-10">
          <div className="p-4 rounded-xl bg-gold/10 border border-gold/30 flex-shrink-0" aria-hidden="true">
            <Download className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h3 className="text-xl font-headline font-bold text-white mb-1 uppercase tracking-wide">
              Secure Full Strategic Briefing
            </h3>
            <p className="text-slate-dim text-sm leading-relaxed">
              Transmit your credentials to receive the comprehensive 12-page 
              <span className="text-gold font-medium"> Strategic Intervention Plan</span> 
              based on your diagnostic results.
            </p>
          </div>
        </div>

        {downloadComplete && downloadUrl ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-4" aria-hidden="true">
              <ShieldCheck className="h-12 w-12 text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-bold text-lg mb-2 uppercase tracking-wide">
              Transmission Complete
            </p>
            <p className="text-slate-dim text-sm mb-6">
              Your Strategic Intervention Plan has been generated. If the download did not start automatically, use the button below.
            </p>
            <Button
              asChild
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12"
            >
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                Download Strategic Briefing
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-5 relative z-10">
            {/* Form Fields */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-mono uppercase tracking-widest text-slate-light flex items-center gap-2">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  Operator Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-nex-dark border-nex-light focus:border-gold h-12 text-white placeholder:text-slate-dim/50"
                  required
                  aria-required="true"
                  aria-invalid={hasAttemptedSubmit && fieldErrors.name ? 'true' : undefined}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  autoComplete="name"
                />
                {hasAttemptedSubmit && fieldErrors.name && (
                  <p id="name-error" role="alert" className="text-xs text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs font-mono uppercase tracking-widest text-slate-light flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Organization
                </Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Enter company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="bg-nex-dark border-nex-light focus:border-gold h-12 text-white placeholder:text-slate-dim/50"
                  required
                  aria-required="true"
                  aria-invalid={hasAttemptedSubmit && fieldErrors.company ? 'true' : undefined}
                  aria-describedby={fieldErrors.company ? 'company-error' : undefined}
                  autoComplete="organization"
                />
                {hasAttemptedSubmit && fieldErrors.company && (
                  <p id="company-error" role="alert" className="text-xs text-red-400">{fieldErrors.company}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-widest text-slate-light flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-nex-dark border-nex-light focus:border-gold h-12 text-white placeholder:text-slate-dim/50"
                required
                aria-required="true"
                aria-invalid={hasAttemptedSubmit && fieldErrors.email ? 'true' : undefined}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {hasAttemptedSubmit && fieldErrors.email && (
                <p id="email-error" role="alert" className="text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleDownloadReport}
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-gold hover:bg-gold-bright text-nex-deep font-bold h-14 text-lg uppercase tracking-widest shadow-lg shadow-gold/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="mr-3 h-6 w-6" aria-hidden="true" />
                  Access Full Intervention Plan
                </>
              )}
            </Button>

            <p className="text-[10px] text-slate-dim text-center uppercase tracking-tighter">
              Your data is encrypted and secure.
            </p>
          </div>
        )}
      </div>

      {/* Strategic Commitment Message */}
      <div className="p-8 rounded-xl bg-nex-surface/30 border border-nex-light text-center mb-12 italic">
        <p className="text-slate-dim leading-relaxed">
          &ldquo;Our diagnostic framework identify structural failure modes that traditional consulting overlooks. 
          We don&apos;t just advise; we architect the capabilities required to maintain 
          <span className="text-white font-semibold"> uncompromised patient safety</span> in a commercial environment.&rdquo;
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
        <Button
          onClick={onBookCall}
          size="lg"
          className="bg-cyan hover:bg-cyan-glow text-nex-deep font-bold px-10 h-14 w-full sm:w-auto uppercase tracking-wide shadow-lg shadow-cyan/10"
        >
          Schedule Strategic Briefing
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-nex-light text-slate-light hover:border-cyan/50 hover:text-white h-14 px-10 w-full sm:w-auto uppercase tracking-wide font-semibold"
        >
          <Link href="/contact">
            <MessageSquare className="mr-2 h-5 w-5" aria-hidden="true" />
            Diagnostic Intake
          </Link>
        </Button>
      </div>

      {/* Secondary action */}
      <div className="text-center mt-10">
        <Button
          variant="ghost"
          onClick={onStartOver}
          className="text-slate-dim hover:text-white text-xs uppercase tracking-widest font-mono"
        >
          <RotateCcw className="mr-2 h-3 w-3" aria-hidden="true" />
          Reset Diagnostic
        </Button>
      </div>
    </div>
  );
}