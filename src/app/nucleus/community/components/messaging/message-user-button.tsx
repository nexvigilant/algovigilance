'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { getOrCreateConversation } from '../../actions/messaging/core';

import { logger } from '@/lib/logger';
const log = logger.scope('components/message-user-button');

interface MessageUserButtonProps {
  userId: string;
  userName: string;
}

export function MessageUserButton({
  userId,
  userName: _userName,
}: MessageUserButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show message button for own profile
  if (!user || user.uid === userId) {
    return null;
  }

  async function handleMessage() {
    setIsLoading(true);
    try {
      const result = await getOrCreateConversation(userId);
      if (result.success && result.data) {
        router.push(`/nucleus/community/messages/${result.data}`);
      } else {
        log.error('Failed to create conversation:', result.error);
      }
    } catch (error) {
      log.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleMessage}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Message
        </>
      )}
    </Button>
  );
}
