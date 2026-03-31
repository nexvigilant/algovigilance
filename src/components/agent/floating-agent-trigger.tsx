'use client';

/**
 * Floating Agent Trigger
 *
 * A persistent floating button that opens the Agent Chat.
 * Hidden on the homepage (since it has the HeroAgentSearch) but visible elsewhere.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentChat } from './agent-chat';

// =============================================================================
// Configuration
// =============================================================================

const SCROLL_CONFIG = {
  /** Scroll threshold in pixels before showing the trigger */
  SCROLL_THRESHOLD: 300,
  /** Throttle interval in milliseconds for scroll handler */
  THROTTLE_MS: 100,
} as const;

export function FloatingAgentTrigger() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Throttle ref for scroll handler
  const lastScrollTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Hide on homepage and nucleus
  const isHomepage = pathname === '/';
  const isNucleus = pathname?.startsWith('/nucleus');
  const shouldShow = !isHomepage && !isNucleus;

  // Throttled scroll handler using requestAnimationFrame for better performance
  const handleScroll = useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < SCROLL_CONFIG.THROTTLE_MS) {
      // Schedule an update for the end of the throttle window if not already scheduled
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          setHasScrolled(window.scrollY > SCROLL_CONFIG.SCROLL_THRESHOLD);
        });
      }
      return;
    }
    lastScrollTimeRef.current = now;
    setHasScrolled(window.scrollY > SCROLL_CONFIG.SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Clean up any pending RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [handleScroll]);

  // Handle escape key to close chat
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  useEffect(() => {
    // Small delay to prevent layout shift during navigation
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      return undefined;
    }
  }, [shouldShow]);

  if (!shouldShow || !isVisible) return null;

  return (
    <>
      {/* Trigger Button */}
      <div 
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-500",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
          !hasScrolled && "translate-y-20 opacity-0"
        )}
      >
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI assistant chat"
          aria-expanded={isOpen}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-nex-surface border border-cyan/30 shadow-2xl shadow-cyan/20 hover:border-cyan hover:scale-110 transition-all duration-300"
        >
          {/* Pulse effect */}
          <div className="absolute inset-0 rounded-full bg-cyan/20 animate-ping opacity-20" />
          
          <div className="relative">
            <Bot className="h-7 w-7 text-cyan" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-gold animate-pulse" />
          </div>
          
          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-nex-surface border border-nex-light text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Ask our Agent
          </div>
        </button>
      </div>

      {/* Chat Interface Overlay */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 animate-in fade-in zoom-in duration-300">
          <div className="relative w-full h-full sm:w-[400px] sm:h-[600px] shadow-2xl">
            <AgentChat 
              onClose={() => setIsOpen(false)} 
              className="h-full border-cyan/30"
            />
          </div>
        </div>
      )}
    </>
  );
}
