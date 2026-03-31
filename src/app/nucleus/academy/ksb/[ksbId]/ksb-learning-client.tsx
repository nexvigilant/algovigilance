'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KSBViewer } from '@/components/academy';
import { useAuth } from '@/hooks/use-auth';
import { getKSBForBuilder } from '@/lib/actions/ksb-builder';
import {
  getKSBProgress,
  updateKSBProgress,
  createPortfolioArtifact,
} from '@/app/nucleus/academy/portfolio/actions';
import type { CapabilityComponent, KSBProgress, PortfolioArtifact } from '@/types/pv-curriculum';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KSBLearningPage() {
  const params = useParams();
  const { user } = useAuth();
  const ksbId = params.ksbId as string;

  const [ksb, setKsb] = useState<CapabilityComponent | null>(null);
  const [progress, setProgress] = useState<KSBProgress | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract domain ID from KSB ID (e.g., "KSB-D01-K0001" -> "D01")
  const domainId = ksbId?.split('-')[1] || 'D01';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load KSB
      const ksbResult = await getKSBForBuilder(domainId, ksbId);
      if (!ksbResult.success || !ksbResult.ksb) {
        setError(ksbResult.error || 'KSB not found');
        setLoading(false);
        return;
      }
      setKsb(ksbResult.ksb);

      // Load progress
      if (user) {
        const progressResult = await getKSBProgress(user.uid, ksbId);
        if (progressResult.success) {
          setProgress(progressResult.progress);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KSB');
    }

    setLoading(false);
  }, [domainId, ksbId, user]);

  useEffect(() => {
    if (ksbId && user) {
      loadData();
    }
  }, [ksbId, user, loadData]);

  const handleProgressUpdate = async (updates: Partial<KSBProgress>) => {
    if (!user || !ksb) return;

    await updateKSBProgress(user.uid, ksbId, ksb.domainId, updates);

    // Update local state
    setProgress((prev) => ({
      ...prev,
      ...updates,
    } as KSBProgress));
  };

  const handleArtifactCreate = async (
    artifact: Omit<PortfolioArtifact, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    await createPortfolioArtifact(artifact);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="py-12 text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-cyan" />
            <p className="text-slate-dim">Loading KSB...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ksb) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="py-12 text-center">
            <p className="text-red-500 mb-4">{error || 'KSB not found'}</p>
            <Button asChild className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
              <Link href="/nucleus/academy">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Academy
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div>
        <KSBViewer
          ksb={ksb}
          progress={progress}
          onProgressUpdate={handleProgressUpdate}
          onArtifactCreate={handleArtifactCreate}
          userId={user?.uid || ''}
        />
      </div>
    </div>
  );
}
