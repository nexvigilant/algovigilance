'use client';

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type {
  UserBehaviorMetrics,
  BehaviorScores,
  SessionData,
  NavigationEvent,
  ContentInteraction,
  CommunityInteraction,
  DecisionEvent,
  MouseMovement,
} from './types';

import { logger } from '@/lib/logger';
import { TIMING } from '@/lib/constants/timing';
const log = logger.scope('behavior-tracking/use-behavior-tracker');

const STORAGE_KEY = 'nexvigilant_behavior_metrics';
const ENABLED_KEY = 'nexvigilant_behavior_tracking_enabled';
const MAX_EVENTS = 1000; // Limit stored events to prevent bloat

// Global toggle - set to false to disable all behavior tracking
// Can also be toggled at runtime via localStorage:
// localStorage.setItem('nexvigilant_behavior_tracking_enabled', 'true')
const BEHAVIOR_TRACKING_ENABLED = true; // ENABLED — localStorage privacy controls still apply

function isTrackingEnabled(): boolean {
  if (!BEHAVIOR_TRACKING_ENABLED) return false;
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(ENABLED_KEY);
  return stored !== 'false'; // Enabled by default if flag is on
}

// Default scores
const defaultScores: BehaviorScores = {
  learningVelocity: 50,
  learningStyle: 'unknown',
  explorationStyle: 'unknown',
  engagementType: 'unknown',
  peakHours: [],
  circadianType: 'unknown',
  curiosityScore: 50,
  detailOrientation: 50,
  decisionStyle: 'unknown',
  avgDecisionTime: 0,
  collaborationPreference: 50,
  lastUpdated: Date.now(),
};

// Default metrics
const defaultMetrics: UserBehaviorMetrics = {
  sessions: [],
  navigationSequences: [],
  contentInteractions: [],
  communityInteractions: [],
  decisions: [],
  mouseMovements: [],
  scores: defaultScores,
};

interface BehaviorTrackerContextType {
  metrics: UserBehaviorMetrics;
  scores: BehaviorScores;

  // Tracking methods
  trackNavigation: (from: string, to: string, hoverDuration?: number) => void;
  trackContent: (interaction: Omit<ContentInteraction, 'timestamp'>) => void;
  trackCommunity: (type: CommunityInteraction['type'], contentId?: string) => void;
  trackDecision: (elementId: string, hoverDuration: number, clicked: boolean) => void;
  trackBacktrack: (elementId: string, duration: number) => void;
  trackMouseSample: (x: number, y: number, pageId: string) => void;
  trackSerendipityResponse: (followed: boolean) => void;

  // Session management
  startSession: () => void;
  endSession: () => void;

  // Reset
  clearMetrics: () => void;
}

const BehaviorTrackerContext = createContext<BehaviorTrackerContextType | null>(null);

// No-op context for when tracking is disabled
const noopContext: BehaviorTrackerContextType = {
  metrics: defaultMetrics,
  scores: defaultScores,
  trackNavigation: () => {},
  trackContent: () => {},
  trackCommunity: () => {},
  trackDecision: () => {},
  trackBacktrack: () => {},
  trackMouseSample: () => {},
  trackSerendipityResponse: () => {},
  startSession: () => {},
  endSession: () => {},
  clearMetrics: () => {},
};

export function useBehaviorTracker() {
  const context = useContext(BehaviorTrackerContext);

  // Return no-op context if tracking is disabled (global flag OR user opt-out)
  if (!isTrackingEnabled()) {
    return noopContext;
  }

  if (!context) {
    throw new Error('useBehaviorTracker must be used within BehaviorTrackerProvider');
  }
  return context;
}

// Load metrics from localStorage
function loadMetrics(): UserBehaviorMetrics {
  if (typeof window === 'undefined') return defaultMetrics;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    log.warn('Failed to load behavior metrics:', e);
  }
  return defaultMetrics;
}

// Save metrics to localStorage
function saveMetrics(metrics: UserBehaviorMetrics) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch (e) {
    log.warn('Failed to save behavior metrics:', e);
  }
}

// Compute scores from raw data
function computeScores(metrics: UserBehaviorMetrics): BehaviorScores {
  const scores = { ...defaultScores, lastUpdated: Date.now() };

  // Learning Velocity & Style
  const contentWithPerformance = metrics.contentInteractions.filter(
    (c) => c.performance !== undefined && c.contentType === 'quiz'
  );
  if (contentWithPerformance.length >= 3) {
    const avgTime = contentWithPerformance.reduce((sum, c) => sum + c.timeSpent, 0) / contentWithPerformance.length;
    const avgPerformance = contentWithPerformance.reduce((sum, c) => sum + (c.performance || 0), 0) / contentWithPerformance.length;

    scores.learningVelocity = Math.min(100, (avgPerformance / Math.max(1, avgTime / 60000)) * 10);

    if (avgTime < 60000 && avgPerformance > 80) {
      scores.learningStyle = 'efficient';
    } else if (avgTime > 180000 && avgPerformance > 80) {
      scores.learningStyle = 'thorough';
    } else if (avgTime < 60000 && avgPerformance < 60) {
      scores.learningStyle = 'skimmer';
    }
  }

  // Exploration Style
  if (metrics.navigationSequences.length >= 10) {
    const sequences = metrics.navigationSequences.slice(-50);
    const returnToCenter = sequences.filter((n) => n.to === '/nucleus').length;
    const uniquePages = new Set(sequences.map((n) => n.to)).size;

    if (returnToCenter > sequences.length * 0.3) {
      scores.explorationStyle = 'hub-spoke';
    } else if (uniquePages < sequences.length * 0.3) {
      scores.explorationStyle = 'depth-first';
    } else if (uniquePages > sequences.length * 0.8) {
      scores.explorationStyle = 'scatter';
    } else {
      scores.explorationStyle = 'linear';
    }
  }

  // Engagement Type
  const recentCommunity = metrics.communityInteractions.slice(-100);
  if (recentCommunity.length >= 10) {
    const posts = recentCommunity.filter((c) => c.type === 'post' || c.type === 'comment').length;
    const reads = recentCommunity.filter((c) => c.type === 'read').length;
    const ratio = posts / Math.max(1, reads);

    if (ratio > 0.5) {
      scores.engagementType = 'creator';
    } else if (ratio < 0.1) {
      scores.engagementType = 'consumer';
    } else if (ratio >= 0.1 && ratio <= 0.5) {
      scores.engagementType = 'conversationalist';
    }
    if (posts + reads < 5) {
      scores.engagementType = 'lurker';
    }
  }

  // Circadian Type
  if (metrics.sessions.length >= 5) {
    const hourCounts = new Array(24).fill(0);
    metrics.sessions.forEach((s) => {
      hourCounts[s.hourOfDay]++;
    });

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    scores.peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((h) => h.hour);

    if (maxHour >= 5 && maxHour <= 11) {
      scores.circadianType = 'morning';
    } else if (maxHour >= 12 && maxHour <= 17) {
      scores.circadianType = 'afternoon';
    } else {
      scores.circadianType = 'night';
    }

    const weekendSessions = metrics.sessions.filter((s) => s.dayOfWeek === 0 || s.dayOfWeek === 6).length;
    if (weekendSessions > metrics.sessions.length * 0.6) {
      scores.circadianType = 'weekend';
    }
  }

  // Decision Style
  if (metrics.decisions.length >= 10) {
    const avgDecision = metrics.decisions.reduce((sum, d) => sum + d.hoverDuration, 0) / metrics.decisions.length;
    scores.avgDecisionTime = avgDecision;

    if (avgDecision < 500) {
      scores.decisionStyle = 'quick';
    } else if (avgDecision > 2000) {
      scores.decisionStyle = 'deliberate';
    } else {
      const backtracks = metrics.decisions.filter((d) => d.backtrackedWithin !== undefined).length;
      if (backtracks > metrics.decisions.length * 0.3) {
        scores.decisionStyle = 'hesitant';
      } else {
        scores.decisionStyle = 'deliberate';
      }
    }
  }

  // Collaboration Preference
  const soloActivities = metrics.contentInteractions.length;
  const socialActivities = metrics.communityInteractions.length;
  if (soloActivities + socialActivities > 10) {
    scores.collaborationPreference = Math.round((socialActivities / (soloActivities + socialActivities)) * 100);
  }

  return scores;
}

// Provider component
export function BehaviorTrackerProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<UserBehaviorMetrics>(defaultMetrics);
  const currentSessionRef = useRef<SessionData | null>(null);
  const initialized = useRef(false);

  // Load on mount
  useEffect(() => {
    if (!initialized.current) {
      const loaded = loadMetrics();
      setMetrics(loaded);
      initialized.current = true;
    }
  }, []);

  // Save on change (debounced to avoid frequent localStorage writes)
  useEffect(() => {
    if (!initialized.current || !isTrackingEnabled()) return;

    const timeoutId = setTimeout(() => {
      saveMetrics(metrics);
    }, TIMING.retryBaseDelay); // Debounce using standard base delay

    return () => clearTimeout(timeoutId);
  }, [metrics]);

  // Trim arrays to prevent bloat
  const trimArrays = useCallback((m: UserBehaviorMetrics): UserBehaviorMetrics => {
    return {
      ...m,
      sessions: m.sessions.slice(-100),
      navigationSequences: m.navigationSequences.slice(-MAX_EVENTS),
      contentInteractions: m.contentInteractions.slice(-MAX_EVENTS),
      communityInteractions: m.communityInteractions.slice(-MAX_EVENTS),
      decisions: m.decisions.slice(-MAX_EVENTS),
      mouseMovements: m.mouseMovements.slice(-MAX_EVENTS),
    };
  }, []);

  const startSession = useCallback(() => {
    const now = new Date();
    currentSessionRef.current = {
      startTime: now.getTime(),
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours(),
      pagesVisited: [],
      interactions: 0,
    };
  }, []);

  const endSession = useCallback(() => {
    if (currentSessionRef.current) {
      const session = {
        ...currentSessionRef.current,
        endTime: Date.now(),
      };
      setMetrics((prev) => {
        const updated = trimArrays({
          ...prev,
          sessions: [...prev.sessions, session],
        });
        updated.scores = computeScores(updated);
        return updated;
      });
      currentSessionRef.current = null;
    }
  }, [trimArrays]);

  const trackNavigation = useCallback((from: string, to: string, hoverDuration?: number) => {
    const event: NavigationEvent = {
      from,
      to,
      timestamp: Date.now(),
      hoverDuration,
    };

    if (currentSessionRef.current) {
      currentSessionRef.current.pagesVisited.push(to);
      currentSessionRef.current.interactions++;
    }

    setMetrics((prev) => {
      const updated = trimArrays({
        ...prev,
        navigationSequences: [...prev.navigationSequences, event],
      });
      updated.scores = computeScores(updated);
      return updated;
    });
  }, [trimArrays]);

  const trackContent = useCallback((interaction: Omit<ContentInteraction, 'timestamp'>) => {
    const event: ContentInteraction = {
      ...interaction,
      timestamp: Date.now(),
    };

    if (currentSessionRef.current) {
      currentSessionRef.current.interactions++;
    }

    setMetrics((prev) => {
      const updated = trimArrays({
        ...prev,
        contentInteractions: [...prev.contentInteractions, event],
      });
      updated.scores = computeScores(updated);
      return updated;
    });
  }, [trimArrays]);

  const trackCommunity = useCallback((type: CommunityInteraction['type'], contentId?: string) => {
    const event: CommunityInteraction = {
      type,
      contentId,
      timestamp: Date.now(),
    };

    if (currentSessionRef.current) {
      currentSessionRef.current.interactions++;
    }

    setMetrics((prev) => {
      const updated = trimArrays({
        ...prev,
        communityInteractions: [...prev.communityInteractions, event],
      });
      updated.scores = computeScores(updated);
      return updated;
    });
  }, [trimArrays]);

  const trackDecision = useCallback((elementId: string, hoverDuration: number, clicked: boolean) => {
    const event: DecisionEvent = {
      elementId,
      hoverDuration,
      clicked,
      timestamp: Date.now(),
    };

    setMetrics((prev) => {
      const updated = trimArrays({
        ...prev,
        decisions: [...prev.decisions, event],
      });
      updated.scores = computeScores(updated);
      return updated;
    });
  }, [trimArrays]);

  const trackBacktrack = useCallback((elementId: string, duration: number) => {
    setMetrics((prev) => {
      const decisions = [...prev.decisions];
      // Find last matching decision (backwards-compatible, findLast not in all browsers)
      let lastDecision: DecisionEvent | undefined;
      for (let i = decisions.length - 1; i >= 0; i--) {
        if (decisions[i].elementId === elementId) {
          lastDecision = decisions[i];
          break;
        }
      }
      if (lastDecision) {
        lastDecision.backtrackedWithin = duration;
      }
      const updated = { ...prev, decisions };
      updated.scores = computeScores(updated);
      return updated;
    });
  }, []);

  const trackMouseSample = useCallback((x: number, y: number, pageId: string) => {
    const event: MouseMovement = {
      x,
      y,
      pageId,
      timestamp: Date.now(),
    };

    setMetrics((prev) => trimArrays({
      ...prev,
      mouseMovements: [...prev.mouseMovements, event],
    }));
  }, [trimArrays]);

  const trackSerendipityResponse = useCallback((followed: boolean) => {
    setMetrics((prev) => {
      const delta = followed ? 5 : -2;
      const newScore = Math.max(0, Math.min(100, prev.scores.curiosityScore + delta));
      return {
        ...prev,
        scores: {
          ...prev.scores,
          curiosityScore: newScore,
          lastUpdated: Date.now(),
        },
      };
    });
  }, []);

  const clearMetrics = useCallback(() => {
    setMetrics(defaultMetrics);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: BehaviorTrackerContextType = {
    metrics,
    scores: metrics.scores,
    trackNavigation,
    trackContent,
    trackCommunity,
    trackDecision,
    trackBacktrack,
    trackMouseSample,
    trackSerendipityResponse,
    startSession,
    endSession,
    clearMetrics,
  };

  return (
    <BehaviorTrackerContext.Provider value={value}>
      {children}
    </BehaviorTrackerContext.Provider>
  );
}
