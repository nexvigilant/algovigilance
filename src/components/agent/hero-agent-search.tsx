'use client';

/**
 * Hero Agent Search Component
 *
 * A search bar that transforms into a conversational chat interface.
 * Positioned prominently in the hero section to capture visitor intent.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentChat } from './agent-chat';

// =============================================================================
// Types
// =============================================================================

interface HeroAgentSearchProps {
  className?: string;
  placeholder?: string;
}

// =============================================================================
// Component
// =============================================================================

export function HeroAgentSearch({
  className,
  placeholder = "What can we help you with today?",
}: HeroAgentSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close (only when expanded and in conversation mode)
  // Note: We intentionally keep the collapsed search bar stable - clicking outside
  // when in collapsed mode does NOT close or modify anything
  useEffect(() => {
    if (!isExpanded || isFullScreen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Only close if user hasn't entered any text (prevent data loss)
        if (!inputValue.trim()) {
          setIsExpanded(false);
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, isFullScreen, inputValue]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else if (isExpanded && !inputValue) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded, isFullScreen, inputValue]);

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]);

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = useCallback(() => {
    if (inputValue.trim()) {
      setIsExpanded(true);
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSubmit();
    }
  };

  const handleClose = useCallback(() => {
    setIsExpanded(false);
    setIsFullScreen(false);
    setInputValue('');
  }, []);

  // Collapsed search bar view
  if (!isExpanded) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'w-full max-w-xl mx-auto',
          className
        )}
      >
        {/* Main search input */}
        <div
          className={cn(
            'relative group transition-all duration-300',
            isFocused && 'scale-[1.02]'
          )}
        >
          {/* Glow effect */}
          <div
            className={cn(
              'absolute -inset-1 rounded-2xl transition-opacity duration-300',
              'bg-gradient-to-r from-ember/30 via-gold/20 to-ember/30',
              'blur-lg opacity-0 group-hover:opacity-50',
              isFocused && 'opacity-70'
            )}
          />

          {/* Input container */}
          <div
            className={cn(
              'relative flex items-center gap-3',
              'bg-nex-surface/80 backdrop-blur-xl',
              'border border-nex-light rounded-2xl',
              'px-5 py-4',
              'transition-all duration-300',
              'hover:border-ember/50',
              isFocused && 'border-ember shadow-lg shadow-ember/10'
            )}
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ember/20 to-gold/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-ember" />
              </div>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-label="Ask a question or describe what you need help with"
              className="flex-1 touch-target bg-transparent text-white placeholder:text-slate-light/70 text-base focus:outline-none"
            />

            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              aria-label="Submit search"
              className={cn(
                'flex-shrink-0 min-w-[44px] touch-target px-4 py-2 rounded-xl',
                'text-sm font-medium transition-all duration-300',
                'flex items-center justify-center',
                inputValue.trim()
                  ? 'bg-ember text-white hover:bg-ember-glow'
                  : 'bg-nex-light text-slate-dim cursor-not-allowed'
              )}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

      </div>
    );
  }

  // Expanded chat view
  return (
    <>
      {/* Backdrop for fullscreen */}
      {isFullScreen && (
        <div
          className="fixed inset-0 bg-nex-background/90 backdrop-blur-sm z-40"
          onClick={() => setIsFullScreen(false)}
        />
      )}

      <div
        ref={containerRef}
        className={cn(
          'transition-all duration-500 ease-out',
          isFullScreen
            ? 'fixed inset-4 md:inset-8 z-50'
            : 'w-full max-w-2xl mx-auto',
          className
        )}
      >
        {/* Chat container with controls */}
        <div className="relative h-full">
          {/* Control buttons */}
          <div className="absolute -top-10 right-0 flex items-center gap-2 z-10">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-lg bg-nex-surface/80 border border-nex-light text-slate-dim hover:text-white hover:border-cyan/50 transition-colors"
              aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-nex-surface/80 border border-nex-light text-slate-dim hover:text-white hover:border-red-500/50 transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat component */}
          <AgentChat
            initialMessage={inputValue}
            onClose={handleClose}
            compact={!isFullScreen}
            className={cn(
              isFullScreen ? 'h-full' : 'h-[500px]',
              'shadow-2xl shadow-black/50'
            )}
          />
        </div>
      </div>
    </>
  );
}

