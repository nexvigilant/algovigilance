"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Send, User, Loader2 } from "lucide-react";
import { VoiceLoading, VoiceEmptyStateCompact } from "@/components/voice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
} from "../../actions/messaging/core";
import { trackEvent } from "@/lib/analytics";
import type { Message, Conversation } from "../../actions/messaging/core";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { parseTimestamp } from "@/lib/firestore-utils";
import { SafeHtml } from "@/components/shared/security";

import { logger } from "@/lib/logger";
const log = logger.scope("components/message-thread");

interface MessageThreadProps {
  conversationId: string;
  conversation: Conversation;
}

export function MessageThread({
  conversationId,
  conversation,
}: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation.participants.find(
    (p) => p.id !== user?.uid,
  );

  useEffect(() => {
    loadMessages();
    // Mark conversation as read when viewing
    markConversationAsRead(conversationId);

    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function loadMessages() {
    try {
      const result = await getMessages(conversationId);
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        log.error("Error loading messages:", result.error);
      }
    } catch (error) {
      log.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const result = await sendMessage(conversationId, newMessage);
      if (result.success) {
        trackEvent("message_sent", { conversationId });
        setNewMessage("");
        await loadMessages();
      } else {
        setError(result.error || "Failed to send message");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="holographic-card flex h-full flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <VoiceLoading
            context="community"
            variant="spinner"
            message="Loading messages..."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="holographic-card flex h-full flex-col">
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center gap-3">
          {otherParticipant?.avatar ? (
            <Image
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <CardTitle className="text-lg">
            {otherParticipant?.name || "Unknown User"}
          </CardTitle>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <VoiceEmptyStateCompact
            context="messages"
            description="No messages yet. Start the conversation!"
          />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.uid;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-2",
                    isOwnMessage && "flex-row-reverse",
                  )}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.senderAvatar ? (
                      <Image
                        src={message.senderAvatar}
                        alt={message.senderName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "flex max-w-[70%] flex-col gap-1",
                      isOwnMessage && "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2",
                        isOwnMessage ? "bg-cyan text-white" : "bg-muted",
                      )}
                    >
                      <SafeHtml
                        html={message.contentHtml}
                        type="minimal"
                        as="p"
                        className="whitespace-pre-wrap break-words text-sm"
                      />
                    </div>
                    <p className="px-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(parseTimestamp(message.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <CardContent className="flex-shrink-0 border-t p-4">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="hover:bg-cyan-dark/80 self-end bg-cyan"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </CardContent>
    </Card>
  );
}
