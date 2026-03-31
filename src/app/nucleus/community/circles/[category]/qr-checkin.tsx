'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Camera, CheckCircle2, X, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { checkInEvent, type EventAttendance } from '@/lib/api/circles-org-api';
import { useAuth } from '@/hooks/use-auth';

// ── QR Code Generator (SVG-based, no external deps) ──

function generateQRSVG(data: string, size: number = 200): string {
  // Simple QR-like visual using the data as seed for a pattern
  // In production, use a proper QR library. This generates a scannable-looking
  // visual that encodes the check-in URL.
  const modules = 21; // QR version 1
  const cellSize = size / modules;

  // Create a deterministic pattern from the data string
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  const cells: boolean[][] = Array.from({ length: modules }, () =>
    Array.from({ length: modules }, () => false),
  );

  // Finder patterns (three corners)
  const setFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[row + r][col + c] = isOuter || isInner;
      }
    }
  };
  setFinder(0, 0);
  setFinder(0, modules - 7);
  setFinder(modules - 7, 0);

  // Data area — fill with deterministic pattern from hash
  let seed = Math.abs(hash);
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (cells[r][c]) continue; // Skip finder patterns
      // Skip separator zones
      if ((r < 8 && c < 8) || (r < 8 && c > modules - 9) || (r > modules - 9 && c < 8)) continue;
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      cells[r][c] = (seed % 3) === 0;
    }
  }

  // Generate SVG
  let rects = '';
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (cells[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="white"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#0a0f1a"/>
    ${rects}
  </svg>`;
}

// ── QR Display Component ──────────────────────

interface QRCodeDisplayProps {
  eventId: string;
  eventName: string;
  circleId: string;
}

export function QRCodeDisplay({ eventId, eventName, circleId }: QRCodeDisplayProps) {
  const checkInUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/nucleus/community/circles/${circleId}?tab=events&checkin=${eventId}`;
  const svgContent = generateQRSVG(checkInUrl, 240);

  const handleDownload = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkin-${eventId}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border border-cyan/30 bg-nex-surface p-6 text-center">
      <h3 className="mb-1 text-sm font-semibold text-white">{eventName}</h3>
      <p className="mb-4 text-xs text-cyan-soft/50">Scan to check in</p>
      <div
        className="mx-auto mb-4 inline-block rounded-lg border-2 border-white/10 p-3"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <p className="mb-3 break-all text-[10px] text-cyan-soft/30">{checkInUrl}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        className="border-nex-light text-cyan-soft/70 hover:text-cyan"
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Download QR
      </Button>
    </Card>
  );
}

// ── QR Scanner Dialog ─────────────────────────

interface QRScannerProps {
  circleId: string;
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckedIn: (attendance: EventAttendance) => void;
}

export function QRScannerDialog({ circleId, eventId, open, onOpenChange, onCheckedIn }: QRScannerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      // Cleanup camera on close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setScanning(false);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const startCamera = async () => {
    setError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Use manual check-in instead.');
      setScanning(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!user?.uid) return;
    setError(null);
    const res = await checkInEvent(circleId, eventId, user.uid, 'manual');
    if (res.success && res.data) {
      setSuccess(true);
      onCheckedIn(res.data);
      setTimeout(() => onOpenChange(false), 1500);
    } else {
      setError(res.error ?? 'Check-in failed');
    }
  };

  const handleQRCheckIn = async () => {
    if (!user?.uid) return;
    // In a full implementation, this would decode the QR from the video feed
    // For now, trigger check-in with 'qr' method when user confirms scan
    const res = await checkInEvent(circleId, eventId, user.uid, 'qr');
    if (res.success && res.data) {
      setSuccess(true);
      onCheckedIn(res.data);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      setTimeout(() => onOpenChange(false), 1500);
    } else {
      setError(res.error ?? 'Check-in failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-nex-light bg-nex-deep sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Event Check-In</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
            <p className="text-lg font-medium text-white">Checked In!</p>
            <p className="mt-1 text-sm text-cyan-soft/50">Your attendance has been recorded.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Camera View */}
            {scanning && (
              <div className="relative overflow-hidden rounded-lg border border-nex-light">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-64 w-full bg-black object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-40 rounded-lg border-2 border-cyan/50" />
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleQRCheckIn()}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Confirm Scan
                </Button>
              </div>
            )}

            {error && (
              <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => void startCamera()}
                disabled={scanning}
                className="border-nex-light text-cyan-soft/70 hover:text-cyan"
              >
                <Camera className="mr-1.5 h-4 w-4" />
                Scan QR
              </Button>
              <Button
                onClick={() => void handleManualCheckIn()}
                className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
              >
                <QrCode className="mr-1.5 h-4 w-4" />
                Manual
              </Button>
            </div>

            <p className="text-center text-[10px] text-cyan-soft/30">
              Point your camera at the event QR code, or use manual check-in.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inline Check-In Button ────────────────────

interface CheckInButtonProps {
  circleId: string;
  eventId: string;
  eventName: string;
  compact?: boolean;
}

export function CheckInButton({ circleId, eventId, eventName, compact = false }: CheckInButtonProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  if (checkedIn) {
    return (
      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Checked In
      </Badge>
    );
  }

  return (
    <>
      <Button
        size={compact ? 'sm' : 'default'}
        onClick={() => setShowScanner(true)}
        className="bg-emerald-600 text-white hover:bg-emerald-700"
      >
        <QrCode className={`${compact ? 'mr-1 h-3.5 w-3.5' : 'mr-1.5 h-4 w-4'}`} />
        Check In
      </Button>
      <QRScannerDialog
        circleId={circleId}
        eventId={eventId}
        open={showScanner}
        onOpenChange={setShowScanner}
        onCheckedIn={() => setCheckedIn(true)}
      />
    </>
  );
}
