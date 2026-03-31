"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/branded/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Calendar,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { VoiceLoading } from "@/components/voice";
import { createPortalLink } from "@/lib/actions/stripe";
import {
  fetchUserSubscription,
  type UserSubscriptionData,
} from "@/lib/data/subscription";
import Link from "next/link";

import { logger } from "@/lib/logger";
const log = logger.scope("subscription/subscription-client");

export function SubscriptionClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscriptionData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      if (!user) return;

      try {
        setLoading(true);
        const sub = await fetchUserSubscription(user.uid);
        setSubscription(sub);
      } catch (err) {
        log.error("Error loading subscription:", err);
        setError("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, [user]);

  const handleManageBilling = async () => {
    if (!user) return;

    setLoadingPortal(true);
    setError(null);

    try {
      const result = await createPortalLink(
        user.uid,
        `${window.location.origin}/nucleus/profile/subscription`,
      );

      if (!result.success || !result.url) {
        throw new Error(result.error || "Failed to create portal link");
      }

      // Redirect to Stripe Customer Portal
      window.location.href = result.url;
    } catch (err) {
      log.error("Error creating portal link:", err);
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal",
      );
      setLoadingPortal(false);
    }
  };

  if (loading) {
    return (
      <VoiceLoading
        context="profile"
        variant="fullpage"
        message="Loading subscription..."
      />
    );
  }

  if (!subscription || subscription.status === "canceled") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">
            Subscription
          </h1>
          <p className="text-slate-dim">Manage your membership and billing</p>
        </div>

        <Alert>
          <AlertCircle className="h-5 w-5 text-cyan" />
          <AlertDescription>
            You don't have an active subscription. Subscribe to access all
            AlgoVigilance features.
          </AlertDescription>
        </Alert>

        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-slate-light">
              Choose a Membership
            </CardTitle>
            <CardDescription className="text-slate-dim">
              Get started with AlgoVigilance today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-dim">
              Select a membership tier to unlock unlimited Academy courses, full
              Community access, and professional development resources.
            </p>

            <div className="flex gap-4">
              <Button
                asChild
                className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
              >
                <Link href="/auth/signup">View Pricing</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTierDisplay = () => {
    if (subscription.tier === "student") return "Practitioner Member";
    if (subscription.tier === "professional") return "Professional Member";
    return "Member";
  };

  const getStatusBadge = () => {
    return <StatusBadge status={subscription.status} />;
  };

  const getPriceDisplay = () => {
    if (subscription.tier === "student") {
      if (subscription.postGradStatus === "early_professional") {
        return "$34.99/month";
      }
      if (subscription.postGradStatus === "full_professional") {
        return "$49.99/month";
      }
      return "$14.00/month";
    }
    return "$49.99/month";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">
          Subscription
        </h1>
        <p className="text-slate-dim">Manage your membership and billing</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Past Due Warning */}
      {subscription.status === "past_due" && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>Payment Failed</strong>
            <p className="mt-2">
              We couldn't process your last payment. Please update your payment
              method to avoid service interruption.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Founding Member Badge */}
      {subscription.isFoundingMember && (
        <Card className="bg-gradient-to-br from-nex-gold-400/10 to-nex-gold-500/10 border-nex-gold-400/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-nex-gold-400/20">
                <Sparkles className="h-8 w-8 text-nex-gold-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-1">Founding Member</h3>
                <p className="text-muted-foreground">
                  Thank you for being an early supporter! You have locked-in
                  founding member pricing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-light">
                {getTierDisplay()}
              </CardTitle>
              <CardDescription className="mt-2 text-slate-dim">
                Your current membership plan
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{getPriceDisplay()}</span>
            {subscription.isFoundingMember && (
              <Badge
                variant="secondary"
                className="bg-nex-gold-400/20 text-nex-gold-400"
              >
                Founding Rate
              </Badge>
            )}
          </div>

          {/* Next Renewal */}
          {subscription.currentPeriodEnd &&
            subscription.status === "active" && (
              <div className="flex items-center gap-3 text-slate-dim">
                <Calendar className="h-5 w-5 text-cyan" />
                <span>
                  Next renewal:{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

          {/* Features Summary */}
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Unlimited Academy courses</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Full Community access</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Professional certifications</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Career development tools</span>
            </div>
          </div>

          {/* Manage Billing Button */}
          <Button
            onClick={handleManageBilling}
            disabled={loadingPortal}
            className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
          >
            {loadingPortal ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Opening billing portal...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                Manage Billing
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-slate-dim text-center">
            You'll be redirected to Stripe's secure portal to manage your
            payment method, view invoices, and update your subscription.
          </p>
        </CardContent>
      </Card>

      {/* Student-Specific Information */}
      {subscription.isStudent && (
        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-cyan" />
              <CardTitle className="text-slate-light">
                Practitioner Information
              </CardTitle>
            </div>
            <CardDescription className="text-slate-dim">
              Your practitioner membership details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.universityName && (
              <div>
                <p className="text-sm text-slate-dim mb-1">University</p>
                <p className="font-medium">{subscription.universityName}</p>
              </div>
            )}

            {subscription.expectedGraduation && (
              <div>
                <p className="text-sm text-slate-dim mb-1">
                  Expected Graduation
                </p>
                <p className="font-medium">
                  {subscription.expectedGraduation.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {subscription.rateLocked && (
              <Alert className="bg-green-500/10 border-green-500/50">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <AlertDescription>
                  <strong>Rate Lock Active</strong>
                  <p className="mt-1 text-sm">
                    Your practitioner rate of $14/month is locked during your
                    university enrollment + 3 months post-graduation.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {subscription.postGradStatus === "early_professional" && (
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <AlertDescription>
                  <strong>Early Professional Rate</strong>
                  <p className="mt-1 text-sm">
                    You're now in the early professional period (Years 1-2
                    post-grad) at $34.99/month. This rate will automatically
                    adjust to $49.99/month after 2 years.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/nucleus/profile/student-verification">
                Update Student Information
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-slate-light">Billing & Invoices</CardTitle>
          <CardDescription className="text-slate-dim">
            View your payment history and download invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-dim mb-4">
            Access your complete billing history, download invoices, and view
            payment receipts through the Stripe Customer Portal.
          </p>
          <Button
            onClick={handleManageBilling}
            variant="outline"
            disabled={loadingPortal}
          >
            {loadingPortal ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-5 w-5 text-cyan" />
            )}
            View Billing History
          </Button>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-slate-light">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-dim">
            Have questions about your subscription or billing? We're here to
            help.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/terms">View Terms of Service</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
