"use client";

import {
  useOptimistic,
  useTransition,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { REACTION_TYPES } from "@/lib/community-constants";
import { addReaction, removeReaction } from "../../actions/social/reactions";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

import { logger } from "@/lib/logger";
const log = logger.scope("components/reaction-picker");

type ReactionCounts = {
  like: number;
  love: number;
  insightful: number;
  helpful: number;
  celebrate: number;
};

type ReactionKey = keyof ReactionCounts;

interface ReactionState {
  reaction: string | null;
  counts: ReactionCounts;
}

type ReactionAction =
  | { type: "toggle"; reactionType: ReactionKey; prevReaction: string | null }
  | { type: "rollback" };

interface ReactionPickerProps {
  targetId: string;
  targetType: "post" | "reply";
  currentReaction?: string | null;
  reactionCounts: ReactionCounts;
  className?: string;
}

function applyReactionToggle(
  state: ReactionState,
  reactionType: ReactionKey,
  prevReaction: string | null,
): ReactionState {
  const newCounts = { ...state.counts };

  // Decrement previous reaction if switching types
  if (
    prevReaction &&
    prevReaction !== reactionType &&
    prevReaction in newCounts
  ) {
    newCounts[prevReaction as ReactionKey] = Math.max(
      0,
      newCounts[prevReaction as ReactionKey] - 1,
    );
  }

  if (state.reaction === reactionType) {
    // Toggling the same reaction off
    newCounts[reactionType] = Math.max(0, newCounts[reactionType] - 1);
    return { reaction: null, counts: newCounts };
  }

  // Selecting a new reaction
  newCounts[reactionType] = newCounts[reactionType] + 1;
  return { reaction: reactionType, counts: newCounts };
}

export const ReactionPicker = memo(function ReactionPicker({
  targetId,
  targetType,
  currentReaction = null,
  reactionCounts,
  className,
}: ReactionPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimisticState, dispatchOptimistic] = useOptimistic<
    ReactionState,
    ReactionAction
  >(
    { reaction: currentReaction ?? null, counts: reactionCounts },
    (state, action) => {
      if (action.type === "rollback") {
        return { reaction: currentReaction ?? null, counts: reactionCounts };
      }
      return applyReactionToggle(
        state,
        action.reactionType,
        action.prevReaction,
      );
    },
  );

  const handleReaction = useCallback(
    (reactionType: ReactionKey) => {
      const prevReaction = optimisticState.reaction;

      startTransition(async () => {
        // Apply optimistic update immediately — visible before any await
        dispatchOptimistic({ type: "toggle", reactionType, prevReaction });

        try {
          const result =
            prevReaction === reactionType
              ? await removeReaction({ targetId, targetType })
              : await addReaction({ targetId, targetType, reactionType });

          if (!result.success) {
            // Server rejected — dispatchOptimistic rollback restores prop values
            dispatchOptimistic({ type: "rollback" });
            log.warn("Reaction action rejected by server:", result.error);
          } else {
            // Track post_liked for new reactions (not removals)
            if (prevReaction !== reactionType) {
              trackEvent("post_liked", {
                targetId,
                targetType,
                reactionType,
              });
            }
            // Sync real counts from server after a successful mutation
            router.refresh();
          }
        } catch (error) {
          dispatchOptimistic({ type: "rollback" });
          log.error("Error handling reaction:", error);
        }
      });
    },
    [
      optimisticState.reaction,
      targetId,
      targetType,
      dispatchOptimistic,
      router,
    ],
  );

  const totalReactions = useMemo(
    () =>
      Object.values(optimisticState.counts).reduce(
        (sum, count) => sum + count,
        0,
      ),
    [optimisticState.counts],
  );

  const topReactions = useMemo(
    () =>
      Object.entries(optimisticState.counts)
        .filter(([_key, count]) => count > 0)
        .sort(([_a, countA], [_b, countB]) => countB - countA)
        .slice(0, 3),
    [optimisticState.counts],
  );

  const displayReaction = optimisticState.reaction;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Reaction Summary (if any reactions exist) */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {topReactions.map(([type]) => (
            <span
              key={type}
              className="text-base"
              title={`${optimisticState.counts[type as ReactionKey]} ${REACTION_TYPES[type as keyof typeof REACTION_TYPES].label}`}
            >
              {REACTION_TYPES[type as keyof typeof REACTION_TYPES].emoji}
            </span>
          ))}
          <span className="ml-1 text-xs">{totalReactions}</span>
        </div>
      )}

      {/* Reaction Picker Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs hover:bg-accent",
              displayReaction && "bg-accent text-accent-foreground",
              isPending && "opacity-70",
            )}
            aria-label="React to this post"
            aria-busy={isPending}
          >
            {displayReaction ? (
              <>
                <span className="text-base">
                  {
                    REACTION_TYPES[
                      displayReaction as keyof typeof REACTION_TYPES
                    ].emoji
                  }
                </span>
                <span className="hidden sm:inline">
                  {
                    REACTION_TYPES[
                      displayReaction as keyof typeof REACTION_TYPES
                    ].label
                  }
                </span>
              </>
            ) : (
              <>
                <Smile className="h-3 w-3" />
                <span className="hidden sm:inline">React</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {Object.values(REACTION_TYPES).map((reaction) => (
              <Button
                key={reaction.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 w-10 p-0 transition-transform hover:scale-125",
                  displayReaction === reaction.id &&
                    "bg-accent ring-2 ring-primary",
                )}
                onClick={() => handleReaction(reaction.id as ReactionKey)}
                title={reaction.label}
                aria-label={`React with ${reaction.label}`}
              >
                <span className="text-2xl">{reaction.emoji}</span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
