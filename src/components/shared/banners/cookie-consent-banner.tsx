'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, Shield, X } from 'lucide-react';
import Link from 'next/link';
import { useCookieConsent, defaultConsent, type CookieConsent } from '@/hooks/use-cookie-consent';

// Re-export for backward compatibility
export { useCookieConsent, type CookieConsent } from '@/hooks/use-cookie-consent';

export function CookieConsentBanner() {
  const { updateConsent, hasConsented, isLoaded } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>(defaultConsent);

  // Don't render until we've checked localStorage
  if (!isLoaded) return null;

  // Don't show if already consented
  if (hasConsented) return null;

  const handleAcceptAll = () => {
    updateConsent({
      essential: true,
      analytics: true,
      functional: true,
      timestamp: Date.now(),
      version: '1.0',
    });
  };

  const handleAcceptEssential = () => {
    updateConsent({
      essential: true,
      analytics: false,
      functional: false,
      timestamp: Date.now(),
      version: '1.0',
    });
  };

  const handleSavePreferences = () => {
    updateConsent({
      ...preferences,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-nex-dark/95 backdrop-blur-sm border-t border-cyan/20">
      <div className="max-w-6xl mx-auto">
        {!showDetails ? (
          // Simple view
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-cyan shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white">
                  We use cookies and similar technologies to enhance your experience.
                  Essential cookies are required for basic functionality.
                  You can customize your preferences or accept all.
                </p>
                <Link
                  href="/privacy"
                  className="text-xs text-cyan hover:underline mt-1 inline-block"
                >
                  Read our Privacy Policy
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="text-slate-light hover:text-white hover:bg-white/5"
              >
                Customize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptEssential}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-cyan text-nex-deep hover:bg-cyan-glow font-medium"
              >
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          // Detailed preferences view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan" />
                <h3 className="text-lg font-semibold text-white">Cookie Preferences</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-dim hover:text-white"
                aria-label="Close cookie preferences"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Essential */}
              <div className="p-4 bg-nex-surface rounded-lg border border-cyan/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">Essential</span>
                  <span className="text-xs text-cyan bg-cyan/10 px-2 py-0.5 rounded">Always On</span>
                </div>
                <p className="text-xs text-slate-dim">
                  Required for authentication, security, and basic site functionality. Cannot be disabled.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-4 bg-nex-surface rounded-lg border border-slate-dim/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">Analytics</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-nex-dark rounded-full peer peer-checked:bg-cyan peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-dim">
                  Anonymous usage analytics via Vercel (no cookies, privacy-friendly). Helps us improve the platform.
                </p>
              </div>

              {/* Functional */}
              <div className="p-4 bg-nex-surface rounded-lg border border-slate-dim/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">Functional</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-nex-dark rounded-full peer peer-checked:bg-cyan peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
                <p className="text-xs text-slate-dim">
                  Personalization features like behavior tracking to improve your learning experience.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptEssential}
                className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                onClick={handleSavePreferences}
                className="bg-cyan text-nex-deep hover:bg-cyan-glow font-medium"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
