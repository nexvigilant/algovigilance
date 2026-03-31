'use client';

import { useEffect } from 'react';
import { VoiceError, type ErrorType } from '@/components/voice';

import { logger } from '@/lib/logger';
import { reportError } from '@/lib/error-reporting';
const log = logger.scope('[id]/error');

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getErrorType(error: Error): ErrorType {
  const message = error.message?.toLowerCase() || '';
  if (message.includes('permission') || message.includes('denied') || message.includes('not enrolled')) {
    return 'permission';
  }
  if (message.includes('not found') || message.includes('undefined')) {
    return 'not-found';
  }
  return 'server';
}

export default function LearningInterfaceError({ error, reset }: ErrorProps) {
  useEffect(() => {
    log.error('[Learning Interface Error]', error);
    reportError(error, { component: 'LearningInterfaceError', route: '/nucleus/academy/build/[id]', digest: error.digest });
  }, [error]);

  const errorType = getErrorType(error);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <VoiceError
        type={errorType}
        error={error}
        onRetry={reset}
        variant="page"
        action={{
          label: 'Browse Pathways',
          href: '/nucleus/academy/pathways',
        }}
      />
    </div>
  );
}
