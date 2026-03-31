'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { seedCPAsFromMasterList } from '@/lib/actions/pdc';

export function SeedCPAsButton() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  async function handleSeed() {
    setIsSeeding(true);
    setResult(null);

    try {
      const response = await seedCPAsFromMasterList();

      if (response.success) {
        setResult({
          success: true,
          message: `Successfully created ${response.created} CPAs from master list.`,
        });
        // Refresh the page to show the new data
        router.refresh();
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to seed CPAs',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-nex-deep rounded-lg font-medium hover:bg-gold-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSeeding ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Seeding...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Seed 8 CPAs
          </>
        )}
      </button>

      {result && (
        <p
          className={`text-sm ${
            result.success ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
