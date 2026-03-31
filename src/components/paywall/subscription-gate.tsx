"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { fetchUserSubscription, type UserSubscriptionData } from "@/lib/data/subscription"
import Link from "next/link"

interface SubscriptionGateProps {
  children: React.ReactNode
  /** What the user would see if they had access — shown as preview teaser */
  previewLines?: number
}

/**
 * Paywall gate for premium content.
 * Shows content to active subscribers, upgrade CTA to everyone else.
 * Wraps any page content — place around the components you want gated.
 */
export function SubscriptionGate({ children, previewLines = 0 }: SubscriptionGateProps) {
  const { user, loading: authLoading } = useAuth()
  const [sub, setSub] = useState<UserSubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    fetchUserSubscription(user.uid)
      .then(setSub)
      .finally(() => setLoading(false))
  }, [user?.uid])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Active subscriber — show content
  const isActive = sub?.status === "active" || sub?.status === "trial"
  if (isActive) {
    return <>{children}</>
  }

  // Not subscribed — show paywall
  return (
    <div className="relative">
      {/* Preview teaser — show blurred first N lines */}
      {previewLines > 0 && (
        <div className="relative overflow-hidden" style={{ maxHeight: `${previewLines * 1.75}rem` }}>
          <div className="pointer-events-none select-none opacity-40 blur-[2px]">
            {children}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>
      )}

      {/* Paywall CTA */}
      <div className="rounded-lg border border-border bg-card p-8 text-center mt-4">
        <div className="mx-auto max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Unlock Full Access
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            This content is available to AlgoVigilance members. Get access to our complete
            pharmacovigilance knowledge base, computational tools, and foundational theory
            for <span className="text-foreground font-semibold">$7.99/month</span>.
          </p>

          <div className="space-y-3">
            {user ? (
              <Link
                href="/nucleus/billing"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full"
              >
                Subscribe — $7.99/month
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-full"
              >
                Sign in to Subscribe
              </Link>
            )}

            <p className="text-xs text-muted-foreground">
              Cancel anytime. 3-day free trial included.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Axioms</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">15</p>
              <p className="text-xs text-muted-foreground">CompPV Elements</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">11</p>
              <p className="text-xs text-muted-foreground">Conservation Laws</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
