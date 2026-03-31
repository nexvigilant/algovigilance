'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Share2, Download, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import type { Certificate } from '@/types/academy';
import { generateCertificatePDF } from '@/lib/academy/certificate-generator';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('certificates/certificate-card');

interface CertificateCardProps {
  certificate: Certificate & { courseTitle?: string; courseThumbnail?: string };
}

/** Circular verification seal SVG */
function VerificationSeal({ status }: { status: 'active' | 'expiring' | 'expired' }) {
  const colors = {
    active: { ring: '#d4af37', check: '#d4af37', glow: 'rgba(212,175,55,0.3)' },
    expiring: { ring: '#f59e0b', check: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
    expired: { ring: '#6b7280', check: '#6b7280', glow: 'rgba(107,114,128,0.1)' },
  };
  const c = colors[status];

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="drop-shadow-lg">
      {/* Outer glow */}
      <circle cx="36" cy="36" r="34" fill={c.glow} />
      {/* Outer ring with notches (seal edge) */}
      <circle cx="36" cy="36" r="30" stroke={c.ring} strokeWidth="2" fill="none" opacity="0.6" />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const x1 = 36 + 28 * Math.cos(angle);
        const y1 = 36 + 28 * Math.sin(angle);
        const x2 = 36 + 32 * Math.cos(angle);
        const y2 = 36 + 32 * Math.sin(angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.ring} strokeWidth="1.5" opacity="0.4" />
        );
      })}
      {/* Inner circle */}
      <circle cx="36" cy="36" r="24" stroke={c.ring} strokeWidth="1.5" fill="rgba(0,0,0,0.3)" />
      {/* Shield check icon */}
      <g transform="translate(22, 20)" opacity={status === 'expired' ? 0.5 : 1}>
        <path
          d="M14 2L3 7v6.5c0 5.8 4.7 11.2 11 12.5 6.3-1.3 11-6.7 11-12.5V7L14 2z"
          stroke={c.check}
          strokeWidth="1.5"
          fill="none"
        />
        {status !== 'expired' && (
          <path
            d="M9 14l3.5 3.5L19 10"
            stroke={c.check}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
        {status === 'expired' && (
          <path
            d="M10 11l8 8M18 11l-8 8"
            stroke={c.check}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </g>
    </svg>
  );
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopyLink = () => {
    if (certificate.verificationUrl) {
      navigator.clipboard.writeText(certificate.verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await generateCertificatePDF(certificate);
      log.debug('Certificate downloaded:', certificate.id);
    } catch (error) {
      log.error('Failed to download certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const issuedDate = toDateFromSerialized(certificate.issuedAt);
  const expiresDate = toDateFromSerialized(certificate.expiresAt);

  const isExpired = expiresDate && expiresDate < new Date();
  const isExpiringSoon =
    !isExpired && expiresDate && expiresDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  const status = isExpired ? 'expired' : isExpiringSoon ? 'expiring' : 'active';

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-300 bg-nex-surface',
      status === 'active' && 'border-gold/30 hover:border-gold/60 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]',
      status === 'expiring' && 'border-amber-500/30 hover:border-amber-500/50',
      status === 'expired' && 'border-nex-light/20 opacity-75',
    )}>
      {/* Gold accent bar */}
      <div className={cn(
        'h-1',
        status === 'active' && 'bg-gradient-to-r from-gold/60 via-gold to-gold/60',
        status === 'expiring' && 'bg-gradient-to-r from-amber-500/60 via-amber-500 to-amber-500/60',
        status === 'expired' && 'bg-nex-light/20',
      )} />

      <div className="flex flex-col sm:flex-row">
        {/* Seal Section */}
        <div className="flex items-center justify-center p-6 sm:w-36 sm:flex-shrink-0">
          <VerificationSeal status={status} />
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 sm:p-6 sm:pl-0 flex flex-col justify-between">
          <div>
            {/* Title + Status */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-light truncate">
                  {certificate.courseTitle || 'Capability Verification'}
                </h3>
                <p className="text-xs text-slate-dim font-mono mt-0.5">
                  {certificate.certificateNumber}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider',
                  status === 'active' && 'bg-gold/15 text-gold border border-gold/30',
                  status === 'expiring' && 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                  status === 'expired' && 'bg-red-500/10 text-red-400 border border-red-500/20',
                )}>
                  <ShieldCheck className="h-3 w-3" />
                  {status === 'active' ? 'Verified' : status === 'expiring' ? 'Expiring' : 'Expired'}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-6 text-sm mb-4 mt-3">
              <div>
                <p className="text-[10px] text-slate-dim uppercase tracking-wider">Issued</p>
                <p className="font-medium text-slate-light text-sm">
                  {issuedDate?.toLocaleDateString?.('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) ?? 'N/A'}
                </p>
              </div>
              {expiresDate && (
                <div>
                  <p className="text-[10px] text-slate-dim uppercase tracking-wider">Expires</p>
                  <p className={cn(
                    'font-medium text-sm',
                    isExpired ? 'text-red-400' : 'text-slate-light'
                  )}>
                    {expiresDate.toLocaleDateString?.('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-nex-light/30 text-slate-light hover:bg-nex-light/5 hover:border-cyan/40"
                >
                  <Share2 className="h-3.5 w-3.5 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Your Verification</DialogTitle>
                  <DialogDescription>
                    Share this link to let others verify your capability
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={certificate.verificationUrl || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-nex-light/30 rounded-lg bg-nex-dark text-sm text-slate-light font-mono"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-cyan" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-cyan/30 text-cyan hover:bg-cyan/10"
                    asChild
                  >
                    <Link href={certificate.verificationUrl || '#'} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Public Verification
                    </Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-nex-light/30 text-slate-light hover:bg-nex-light/5 hover:border-gold/40"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gold mr-2" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-2" />
              )}
              {isDownloading ? 'Generating...' : 'Download'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-cyan/30 text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
              asChild
            >
              <Link href={`/verify/certificate/${certificate.id}`} target="_blank">
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Verify
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
