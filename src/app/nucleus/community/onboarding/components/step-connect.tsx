'use client';

/**
 * Step 5: Make a Connection
 *
 * Suggests relevant members to connect with based on shared interests.
 * This is an optional step that can be skipped.
 */

import { useState, useEffect } from 'react';
import { useOnboarding } from '../onboarding-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  UserPlus,
  Loader2,
  SkipForward,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSuggestedUsers, followUser } from '../../actions/social/following';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const log = logger.scope('onboarding/step-connect');

interface SuggestedMember {
  id: string;
  name: string;
  avatar?: string | null;
  title?: string;
  matchScore: number;
  commonInterests: string[];
  reason?: string;
}

export function StepConnect() {
  const { completeStep, skipStep, startStep } = useOnboarding();
  const { toast } = useToast();
  const [members, setMembers] = useState<SuggestedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    startStep('connect');
    loadSuggestions();
  }, [startStep]);

  async function loadSuggestions() {
    try {
      setIsLoading(true);
      const result = await getSuggestedUsers(5);

      if (result.success && result.users) {
        // Map users to the expected SuggestedMember format
        setMembers(result.users.map(u => ({
          id: u.userId,
          name: u.name,
          avatar: u.avatar,
          title: u.bio,
          matchScore: 0,
          commonInterests: [],
        })));
      }
    } catch (error) {
      log.error('Failed to load connection suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect(member: SuggestedMember) {
    setConnectingId(member.id);
    try {
      const result = await followUser(member.id);

      if (result.success) {
        // Mark as connected
        setConnectedIds((prev) => new Set([...prev, member.id]));

        // If this is the first connection, complete the step
        if (connectedIds.size === 0) {
          await completeStep('connect', {
            connectionId: member.id,
            connectionName: member.name,
          });

          toast({
            title: '🎉 Connection Made!',
            description: `You're now following ${member.name}`,
          });
        } else {
          toast({
            title: 'Following',
            description: `You're now following ${member.name}`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: result.error ?? 'Failed to follow user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Failed to connect:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnectingId(null);
    }
  }

  async function handleSkip() {
    setIsSkipping(true);
    try {
      await skipStep('connect');
    } finally {
      setIsSkipping(false);
    }
  }

  // Check if we've already made at least one connection
  const hasConnected = connectedIds.size > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan mb-4" />
        <p className="text-cyan-soft/70">Finding people you might know...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 mb-4">
          <UserPlus className="h-8 w-8 text-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Make a Connection
        </h2>
        <p className="text-cyan-soft/70 max-w-md mx-auto">
          Building your network is key to getting the most from this community.
          Here are some members who share your interests:
        </p>
      </div>

      {/* Member suggestions */}
      <div className="space-y-3">
        {members.length > 0 ? (
          members.map((member, index) => {
            const isConnected = connectedIds.has(member.id);
            const isConnecting = connectingId === member.id;

            return (
              <Card
                key={member.id}
                className={cn(
                  'p-4 bg-nex-light border transition-all',
                  isConnected
                    ? 'border-cyan/50 bg-cyan/5'
                    : 'border-cyan/20 hover:border-cyan/40'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border border-cyan/20">
                    <AvatarImage src={member.avatar ?? undefined} />
                    <AvatarFallback className="bg-nex-surface text-cyan">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">
                        {member.name}
                      </h3>
                      {index === 0 && !isConnected && (
                        <Badge className="bg-gold/20 text-gold border-gold/30 text-xs shrink-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Top Match
                        </Badge>
                      )}
                    </div>
                    {member.title && (
                      <p className="text-sm text-cyan-soft/70 truncate">
                        {member.title}
                      </p>
                    )}
                    {member.commonInterests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.commonInterests.slice(0, 2).map((interest) => (
                          <Badge
                            key={interest}
                            variant="outline"
                            className="text-[10px] border-cyan/30 text-cyan-soft/80"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {member.commonInterests.length > 2 && (
                          <span className="text-[10px] text-slate-dim">
                            +{member.commonInterests.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    onClick={() => handleConnect(member)}
                    disabled={isConnected || connectingId !== null}
                    className={cn(
                      'shrink-0',
                      isConnected
                        ? 'bg-cyan/20 text-cyan cursor-default'
                        : 'bg-cyan hover:bg-cyan-dark text-nex-deep'
                    )}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isConnected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-cyan-soft/70 mb-4">
              No personalized suggestions yet. You can browse the member
              directory to find connections.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-cyan/20">
        <Button
          type="button"
          variant="ghost"
          onClick={handleSkip}
          disabled={isSkipping || hasConnected}
          className="text-slate-dim hover:text-cyan-soft"
        >
          {isSkipping ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SkipForward className="mr-2 h-4 w-4" />
          )}
          Skip for now
        </Button>

        {hasConnected && (
          <div className="text-sm text-cyan-soft flex items-center gap-2">
            <Check className="h-4 w-4" />
            Connection made! The journey continues...
          </div>
        )}
      </div>
    </div>
  );
}
