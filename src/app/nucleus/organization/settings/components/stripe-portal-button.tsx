'use client';

import { useState } from 'react';
import { createPortalLink } from '@/lib/actions/stripe';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';

export function StripePortalButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await createPortalLink(userId, window.location.href);
    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="border-nex-light text-slate-dim hover:text-slate-light"
    >
      <CreditCard className="h-4 w-4 mr-1" />
      {loading ? 'Opening...' : 'Manage Billing'}
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  );
}
