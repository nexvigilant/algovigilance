'use client';

/**
 * Agent Chat Component
 *
 * Full conversational interface for the AlgoVigilance Agent.
 * Handles message history, streaming responses, and action prompts.
 */

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { Send, X, Loader2, Calendar, ArrowRight, Sparkles, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { logger } from '@/lib/logger';
const log = logger.scope('components/agent-chat');

// =============================================================================
// Configuration
// =============================================================================

const AGENT_CONFIG = {
  /** Timeout for API requests in milliseconds */
  API_TIMEOUT_MS: 30_000,
  /** Agent chat API endpoint */
  API_ENDPOINT: '/api/agent/chat',
  /** Google Calendar booking URL */
  BOOKING_URL: 'https://calendar.app.google/aHXe2HbuYCPSjtUs7',
} as const;

// =============================================================================
// Types
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    serviceMatch?: string[];
    suggestedNextStep?: string;
    confidence?: number;
  };
}

interface AgentChatProps {
  onClose?: () => void;
  initialMessage?: string;
  className?: string;
  compact?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function AgentChat({ onClose, initialMessage, className, compact = false }: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState(initialMessage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [suggestedAction, setSuggestedAction] = useState<string | null>(null);
  const [lastMetadata, setLastMetadata] = useState<{ intent?: string; serviceMatch?: string[] }>({});

  // Refs for DOM elements
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Refs for avoiding stale closures and race conditions
  const hasProcessedInitial = useRef(false);
  const isMountedRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate stable unique ID prefix for messages
  const instanceId = useId();
  const messageCounterRef = useRef(0);

  // Keep messagesRef in sync to avoid stale closures
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Abort any in-flight requests on unmount
      abortControllerRef.current?.abort();
    };
  }, []);

  // Generate unique message ID (collision-safe)
  const generateMessageId = useCallback((prefix: string) => {
    messageCounterRef.current += 1;
    return `${instanceId}-${prefix}-${messageCounterRef.current}-${Date.now()}`;
  }, [instanceId]);

  // Define handleSendMessage first so it can be used in effects
  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Preserve input for potential restoration on error
    const originalInput = text;

    // Clear input optimistically
    setInputValue('');

    // Clear stale metadata from previous requests
    setShowActions(false);
    setSuggestedAction(null);
    setLastMetadata({});

    // Add user message with collision-safe ID
    const userMessage: ChatMessage = {
      id: generateMessageId('user'),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Abort any existing request before starting new one
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, AGENT_CONFIG.API_TIMEOUT_MS);

    try {
      // Build conversation history using ref to avoid stale closure
      const history = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call the agent API with abort signal
      const response = await fetch(AGENT_CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          conversationHistory: history,
        }),
        signal: abortController.signal,
      });

      // Clear timeout on successful response
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Guard against state updates after unmount
      if (!isMountedRef.current) return;

      // Add assistant response with collision-safe ID
      const assistantMessage: ChatMessage = {
        id: generateMessageId('assistant'),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        metadata: {
          intent: data.intent,
          serviceMatch: data.serviceMatch,
          suggestedNextStep: data.suggestedNextStep,
          confidence: data.confidence,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Show actions based on suggested next step
      if (data.suggestedNextStep && data.suggestedNextStep !== 'continue-conversation') {
        setSuggestedAction(data.suggestedNextStep);
        setLastMetadata({
          intent: data.intent,
          serviceMatch: data.serviceMatch,
        });
        setShowActions(true);
      }
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);

      // Guard against state updates after unmount
      if (!isMountedRef.current) return;

      // Don't show error for intentional aborts (user navigated away or sent new message)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      log.error('Chat error:', error);

      // Restore input value so user can retry
      setInputValue(originalInput);

      // Add error message with collision-safe ID
      const errorMessage: ChatMessage = {
        id: generateMessageId('error'),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again, or feel free to contact us directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [inputValue, isLoading, generateMessageId]);

  // Auto-scroll to bottom when new messages arrive OR when loading starts
  // This ensures the "Thinking..." indicator is visible even after long user messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Process initial message if provided - only runs once on mount with initial message
  useEffect(() => {
    if (initialMessage && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      // Use requestAnimationFrame to ensure DOM is ready (more reliable than setTimeout)
      // Double rAF ensures the paint cycle has completed
      let rafId: number;
      const scheduleInitialMessage = () => {
        rafId = requestAnimationFrame(() => {
          rafId = requestAnimationFrame(() => {
            if (isMountedRef.current) {
              handleSendMessage(initialMessage);
            }
          });
        });
      };
      scheduleInitialMessage();
      return () => cancelAnimationFrame(rafId);
    }
    return undefined;
  }, [initialMessage, handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't trigger send during IME composition (e.g., CJK input methods)
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  // Auto-resize textarea using effect for synchronous measurement
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight, then set to actual
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [inputValue]);

  // Render action buttons based on suggested next step
  const renderActionButtons = () => {
    if (!showActions) return null;

    switch (suggestedAction) {
      case 'offer-booking':
        return (
          <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
            <Button
              asChild
              size="sm"
              className="bg-cyan text-nex-deep hover:bg-cyan-glow"
            >
              <a
                href={AGENT_CONFIG.BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar className="h-4 w-4 mr-1.5" />
                Schedule a Call
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-light hover:text-white"
              onClick={() => setShowActions(false)}
            >
              Keep Chatting
            </Button>
          </div>
        );

      case 'offer-service-wizard':
        {
          // Map intent/serviceMatch to wizard branch
          let branch = '';
          if (lastMetadata.intent === 'problem-solving') branch = 'challenge';
          else if (lastMetadata.intent === 'opportunity-seeking') branch = 'opportunity';
          else if (lastMetadata.intent === 'exploring' || lastMetadata.intent === 'information-gathering') branch = 'exploration';
          
          const wizardUrl = `/services${branch ? `?branch=${branch}` : ''}${lastMetadata.intent ? `${branch ? '&' : '?'}intent=${lastMetadata.intent}` : ''}`;
          
          return (
            <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
              <Button
                asChild
                size="sm"
                className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
              >
                <Link href={wizardUrl}>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Begin Diagnostic Assessment
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-light hover:text-white"
                onClick={() => setShowActions(false)}
              >
                Keep Chatting
              </Button>
            </div>
          );
        }

      case 'offer-membership':
        return (
          <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
            <Button
              asChild
              size="sm"
              className="bg-cyan/20 text-cyan hover:bg-cyan/30 border border-cyan/30"
            >
              <Link href="/auth/signup">
                <ArrowRight className="h-4 w-4 mr-1.5" />
                Explore Membership
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-light hover:text-white"
              onClick={() => setShowActions(false)}
            >
              Keep Chatting
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-nex-surface border border-nex-light rounded-2xl overflow-hidden',
        compact ? 'max-h-[500px]' : 'h-[600px] max-h-[80vh]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-nex-light bg-nex-dark/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-cyan-glow flex items-center justify-center">
            <Bot className="h-4 w-4 text-nex-deep" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AlgoVigilance Agent</h3>
            <p className="text-xs text-slate-dim">Here to help you find the right solution</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-dim hover:text-white"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages - with live region for screen reader announcements */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Welcome message if no messages yet */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan/20 to-gold/20 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-cyan" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              How can we help you today?
            </h4>
            <p className="text-sm text-slate-dim max-w-xs mx-auto">
              Tell me about your challenge, opportunity, or question—I'll help you find the right solution.
            </p>
            {/* Quick prompts */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                'We need help with our PV operations',
                "I'm exploring career options",
                'What services do you offer?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 text-xs rounded-full border border-nex-light bg-nex-dark/50 text-slate-light hover:border-cyan/50 hover:text-cyan transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
                message.role === 'user'
                  ? 'bg-slate-dim/20'
                  : 'bg-gradient-to-br from-cyan to-cyan-glow'
              )}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-slate-light" />
              ) : (
                <Bot className="h-4 w-4 text-nex-deep" />
              )}
            </div>

            {/* Message bubble */}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5',
                message.role === 'user'
                  ? 'bg-cyan/20 text-white rounded-br-md'
                  : 'bg-nex-dark border border-nex-light text-slate-light rounded-bl-md'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-cyan-glow flex items-center justify-center">
              <Bot className="h-4 w-4 text-nex-deep" />
            </div>
            <div className="bg-nex-dark border border-nex-light rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-cyan animate-spin" />
                <span className="text-sm text-slate-dim">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons after last assistant message */}
        {messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant' &&
          !isLoading &&
          renderActionButtons()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-nex-light bg-nex-dark/30">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-nex-light bg-nex-surface px-4 py-3 pr-12 text-sm text-white placeholder:text-slate-dim focus:border-cyan focus:outline-none focus:ring-1 focus:ring-cyan/50"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-11 w-11 rounded-xl bg-cyan text-nex-deep hover:bg-cyan-glow disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-slate-dim mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
