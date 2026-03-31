'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyPage() {
  const router = useRouter();
  const [capabilityNumber, setCapabilityNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const raw = capabilityNumber.trim().toUpperCase().replace(/\s/g, '');
    if (!raw) {
      setError('Please enter a capability number');
      return;
    }
    if (!/^[A-Z0-9-]+$/.test(raw)) {
      setError('Capability number must use only letters, numbers, and hyphens');
      return;
    }

    // Navigate to verification page
    router.push(`/verify/${raw}`);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 max-w-2xl">
      <div className="text-center mb-8">
        <Award className="h-16 w-16 mx-auto text-primary mb-4" aria-hidden="true" />
        <h1 className="text-4xl font-bold font-headline tracking-tight mb-2">
          Verify Capability
        </h1>
        <p className="text-muted-foreground">
          Enter a capability number to verify its authenticity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capability Verification</CardTitle>
          <CardDescription>
            AlgoVigilance Academy capabilities can be verified using the capability number found in
            your capability repository.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="capabilityNumber">Capability Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="capabilityNumber"
                  type="text"
                  placeholder="e.g., NVA-2025-12345"
                  value={capabilityNumber}
                  onChange={(e) => {
                    setCapabilityNumber(e.target.value);
                    setError('');
                  }}
                  className="pl-10"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Search className="mr-2 h-4 w-4" />
              Verify Capability
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Where to find your capability number</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Your capability number can be found in your capability repository, usually
              in the format: <code className="bg-muted px-1 py-0.5 rounded">NVA-YYYY-XXXXX</code>
            </p>
            <p className="text-sm text-muted-foreground">
              If you can&apos;t find your capability number, please contact us at{' '}
              <a href="mailto:support@nexvigilant.com" className="text-primary hover:underline">
                support@nexvigilant.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          All AlgoVigilance Academy capabilities are verifiable through this system. If you encounter
          any issues, please contact our support team.
        </p>
      </div>
    </div>
  );
}
