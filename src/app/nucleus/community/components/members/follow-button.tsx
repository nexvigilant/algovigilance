"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import {
  followUser,
  unfollowUser,
  isFollowing,
} from "../../actions/social/following";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { logger } from "@/lib/logger";
const log = logger.scope("components/follow-button");

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
}

export function FollowButton({
  targetUserId,
  variant = "default",
  size = "default",
  showIcon = true,
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Loading state only during initial follow status check
  const [loading, setLoading] = useState(true);
  // Confirmed server state — source of truth for useOptimistic
  const [confirmedFollowing, setConfirmedFollowing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Optimistic toggle layered on top of confirmed server state
  const [optimisticFollowing, dispatchOptimistic] = useOptimistic(
    confirmedFollowing,
    (_state: boolean, next: boolean) => next,
  );

  useEffect(() => {
    let cancelled = false;

    async function checkFollowStatus() {
      setLoading(true);
      try {
        const result = await isFollowing(targetUserId);
        if (!cancelled && result.success) {
          setConfirmedFollowing(result.isFollowing ?? false);
        }
      } catch (error) {
        log.error("Error checking follow status:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void checkFollowStatus();
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  function handleClick() {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    const targetState = !confirmedFollowing;

    startTransition(async () => {
      // Apply optimistic toggle immediately — no spinner, no disabled state
      dispatchOptimistic(targetState);

      try {
        const result = confirmedFollowing
          ? await unfollowUser(targetUserId)
          : await followUser(targetUserId);

        if (result.success) {
          // Confirm the server accepted the change
          setConfirmedFollowing(targetState);
          if (targetState) {
            trackEvent("connection_made", { targetUserId });
          }
        } else {
          // Server rejected — dispatchOptimistic reverting to confirmedFollowing
          dispatchOptimistic(confirmedFollowing);
          toast({
            title: confirmedFollowing
              ? "Failed to unfollow"
              : "Failed to follow",
            description: result.error ?? "Please try again later",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Network error — revert to confirmed state
        dispatchOptimistic(confirmedFollowing);
        log.error("Error toggling follow:", error);
        toast({
          title: "Error",
          description: "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  // Don't show follow button for own profile
  if (user && user.uid === targetUserId) {
    return null;
  }

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={optimisticFollowing ? "outline" : variant}
      size={size}
      onClick={handleClick}
      aria-busy={isPending}
      className={isPending ? "opacity-70" : undefined}
    >
      {showIcon ? (
        optimisticFollowing ? (
          <UserMinus className="mr-2 h-4 w-4" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )
      ) : null}
      {optimisticFollowing ? "Following" : "Follow"}
    </Button>
  );
}
