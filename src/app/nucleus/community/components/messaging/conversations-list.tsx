'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Mail, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { getConversations } from '../../actions/messaging/core';
import type { Conversation } from '../../actions/messaging/core';
import { cn } from '@/lib/utils';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { parseTimestamp } from '@/lib/firestore-utils';
import { useAuth } from '@/hooks/use-auth';
import { toAppError, getUserFriendlyMessage } from '@/types/errors';

import { logger } from '@/lib/logger';
const log = logger.scope('components/conversations-list');

export function ConversationsList() {
  const { user } = useAuth();
  const params = useParams();
  const activeConversationId = params?.conversationId as string | undefined;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    setError(null);
    try {
      const result = await getConversations();
      if (result.success && result.data) {
        setConversations(result.data);
      } else {
        setError(result.error || 'Failed to load conversations');
      }
    } catch (err) {
      const appError = toAppError(err);
      log.error('Error loading conversations:', appError);
      setError(getUserFriendlyMessage(appError));
    } finally {
      setIsLoading(false);
    }
  }

  function getOtherParticipant(conversation: Conversation) {
    return conversation.participants.find((p) => p.id !== user?.uid);
  }

  if (isLoading) {
    return (
      <Card className="holographic-card h-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <VoiceLoading context="community" variant="spinner" message="Loading conversations..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="holographic-card h-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive/70" />
            <div>
              <p className="font-medium text-foreground">{error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check your connection and try again
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                loadConversations();
              }}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="holographic-card h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <VoiceEmptyState
            context="messages"
            title="No conversations yet"
            description="Start a conversation from a user's profile"
            variant="inline"
            size="sm"
          />
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isActive = activeConversationId === conversation.id;

              return (
                <Link
                  key={conversation.id}
                  href={`/nucleus/community/messages/${conversation.id}`}
                  className={cn(
                    'block p-3 hover:bg-muted/30 transition-colors',
                    isActive && 'bg-cyan/10 border-l-2 border-cyan'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {otherParticipant?.avatar ? (
                        <Image
                          src={otherParticipant.avatar}
                          alt={otherParticipant.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">
                          {otherParticipant?.name || 'Unknown User'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="bg-cyan-dark text-white text-xs px-1.5 py-0 h-5 flex-shrink-0"
                          >
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {conversation.lastMessage && (
                        <>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {conversation.lastMessage.senderId === user?.uid && 'You: '}
                            {conversation.lastMessage.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              parseTimestamp(conversation.lastMessage.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
