'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CertificateCard } from './certificate-card';
import { getCertificatesByUser } from './actions-client';
import type { Certificate } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('certificates/certificates-client');

export function CertificatesClient() {
  const { user, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadCertificates();
    } else if (!authLoading && !user) {
      setError('Please sign in to view your certificates');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadCertificates = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const certs = await getCertificatesByUser(user.uid);
      setCertificates(certs);
    } catch (err) {
      log.error('[CertificatesClient] Error loading certificates:', err);
      setError('Failed to load certificates. Please try again later.');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">My Certificates</h1>
          <p className="text-muted-foreground">
            Earned capability verification documents
          </p>
        </div>

        {/* Loading skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">My Certificates</h1>
          <p className="text-muted-foreground">
            Earned capability verification documents
          </p>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">My Certificates</h1>
        <p className="text-slate-dim">
          Earned capability verification documents for your professional development
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-12">
            <div className="text-center">
              <Award className="h-12 w-12 text-slate-dim mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-light">No Certificates Yet</h3>
              <p className="text-slate-dim mb-6">
                Complete capability pathways to earn certificates and showcase your expertise
              </p>
              <Button asChild className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
                <a href="/nucleus/academy">Start Building Capabilities</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <Card className="mb-8 bg-nex-surface border border-gold/20 hover:border-gold/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300">
            <div className="h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gold">
                <Award className="h-5 w-5 text-gold" />
                Verification Portfolio
              </CardTitle>
              <CardDescription className="text-slate-dim">
                {certificates.length} verified {certificates.length === 1 ? 'capability' : 'capabilities'} earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-slate-dim uppercase tracking-wider">Verifications</p>
                  <p className="text-3xl font-bold text-gold">{certificates.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-dim uppercase tracking-wider">Active</p>
                  <p className="text-3xl font-bold text-cyan">
                    {certificates.filter(c => !c.isRevoked).length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-dim uppercase tracking-wider">Shareable Links</p>
                  <p className="text-3xl font-bold text-cyan">
                    {certificates.filter(c => c.verificationUrl).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificates List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-light">Your Verified Capabilities</h2>
            {certificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
