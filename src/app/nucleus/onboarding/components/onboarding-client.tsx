"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { completeOnboarding } from "@/lib/actions/users";
import {
  createTenant,
  type SubscriptionTier,
  type CreateTenantInput,
} from "@/lib/actions/tenant";
import type { TherapeuticArea } from "@/lib/actions/tenant";
import type { CompleteOnboardingInput } from "@/lib/schemas/firestore";
import { getErrorMessage } from "@/lib/error-reporting";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import type { PlatformSectionId } from "@/config/site-navigation";

import { logger } from "@/lib/logger";
import { useOnboardingForm } from "../hooks/use-onboarding-form";
import { type OrgFormData, STEP_TITLES } from "./constants";
import { OrgStep } from "./org-step";
import { ProfileStep } from "./profile-step";
import { ExperienceStep } from "./experience-step";
import { ProfessionalExperienceStep } from "./professional-experience-step";
import { ReviewStep } from "./review-step";
import { WelcomeScreen } from "./welcome-screen";
import { TryToolScreen } from "./try-tool-screen";

const log = logger.scope("onboarding/client");

const TOTAL_STEPS = 5;

type OnboardingPhase = "welcome" | "try-tool" | "form";

export function OnboardingClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<OnboardingPhase>("welcome");
  const [chosenPath, setChosenPath] = useState<PlatformSectionId>("work");
  const [chosenDestination, setChosenDestination] = useState("/nucleus");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Organization form state (Step 1)
  const [orgData, setOrgData] = useState<OrgFormData>({
    organizationName: "",
    tier: "",
    therapeuticAreas: [],
    organizationSize: "",
    website: "",
  });

  // Profile form (Steps 2-5)
  const form = useOnboardingForm();

  const progress = (step / TOTAL_STEPS) * 100;

  function toggleTherapeuticArea(area: TherapeuticArea) {
    setOrgData((prev) => {
      const existing = prev.therapeuticAreas;
      if (existing.includes(area)) {
        return {
          ...prev,
          therapeuticAreas: existing.filter((a) => a !== area),
        };
      }
      return { ...prev, therapeuticAreas: [...existing, area] };
    });
  }

  function validateCurrentStep(): boolean {
    setError(null);

    if (step === 1) {
      if (!orgData.organizationName.trim()) {
        setError("Organization name is required");
        return false;
      }
      if (!orgData.tier) {
        setError("Please select an organization type");
        return false;
      }
      if (orgData.therapeuticAreas.length === 0) {
        setError("Select at least one therapeutic area");
        return false;
      }
    }

    if (step === 2) {
      if (!form.name || form.name.trim() === "") {
        setError("Name is required");
        return false;
      }
    }

    return true;
  }

  function handleNext() {
    if (validateCurrentStep()) {
      setStep(Math.min(TOTAL_STEPS, step + 1));
    }
  }

  async function onSubmit(profileData: CompleteOnboardingInput) {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Step A: Create tenant organization
      if (orgData.tier) {
        log.debug("Creating tenant organization");
        const tenantResult = await createTenant(user.uid, user.email || "", {
          organizationName: orgData.organizationName,
          tier: orgData.tier as SubscriptionTier,
          therapeuticAreas: orgData.therapeuticAreas,
          organizationSize:
            orgData.organizationSize as CreateTenantInput["organizationSize"],
          website: orgData.website || undefined,
        });

        if (!tenantResult.success) {
          setError(tenantResult.error || "Failed to create organization");
          return;
        }
        log.debug("Tenant created", { tenantId: tenantResult.tenantId });
      }

      // Step B: Complete personal profile
      log.debug("Completing personal profile");
      const profileResult = await completeOnboarding(user.uid, profileData);

      if (!profileResult.success) {
        setError(profileResult.error || "Failed to complete profile");
        return;
      }

      setSuccess(true);
      log.debug("Onboarding complete, redirecting to", chosenDestination);
      setTimeout(() => {
        router.push(chosenDestination);
      }, 1500);
    } catch (err: unknown) {
      log.error("Onboarding error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // Phase: Welcome — Choose Your Path
  // ============================================================================

  if (phase === "welcome") {
    return (
      <WelcomeScreen
        userName={user?.displayName || ""}
        onSelectPath={(path, destination) => {
          setChosenPath(path);
          setChosenDestination(destination);
          setPhase("try-tool");
        }}
        onSkip={() => setPhase("form")}
      />
    );
  }

  // ============================================================================
  // Phase: Try a Tool — Guided First Use
  // ============================================================================

  if (phase === "try-tool") {
    return (
      <TryToolScreen
        chosenPath={chosenPath}
        destination={chosenDestination}
        onContinueToSetup={() => setPhase("form")}
        onGoToDestination={() => router.push(chosenDestination)}
      />
    );
  }

  // ============================================================================
  // Success State
  // ============================================================================

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md bg-nex-surface border border-nex-light">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-cyan mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gold">
              Welcome to AlgoVigilance!
            </h2>
            <p className="text-slate-dim">
              {orgData.organizationName
                ? `${orgData.organizationName} is set up. Redirecting to your dashboard...`
                : "Your profile is complete. Redirecting to Nucleus..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-nex-surface p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">
            {step === 1
              ? "Set Up Your Organization"
              : "Complete Your Professional Profile"}
          </h1>
          <p className="text-slate-dim">
            {step === 1
              ? "Create your research organization to start building vigilance programs."
              : "Tell us about your professional background. This helps us personalize your experience."}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm text-slate-dim">
            <span>
              Step {step} of {TOTAL_STEPS}: {STEP_TITLES[step]?.title}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form
          onSubmit={form.handleSubmit(onSubmit, (validationErrors) => {
            // Surface hidden validation errors (e.g., empty education/credential entries)
            const fieldNames = Object.keys(validationErrors);
            if (fieldNames.length > 0) {
              const first = fieldNames[0];
              const msg =
                validationErrors[first as keyof typeof validationErrors]
                  ?.message;
              setError(
                msg
                  ? String(msg)
                  : `Please complete required fields: ${fieldNames.join(", ")}`,
              );
            }
          })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target !== e.currentTarget) {
              const target = e.target as HTMLElement;
              if (
                target.tagName !== "BUTTON" ||
                target.getAttribute("type") !== "submit"
              ) {
                e.preventDefault();
              }
            }
          }}
        >
          <Card className="bg-nex-surface border border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                {step === 1 && (
                  <>
                    <Shield className="h-5 w-5 text-cyan" />{" "}
                    {STEP_TITLES[step].title}
                  </>
                )}
                {step > 1 && STEP_TITLES[step]?.title}
              </CardTitle>
              <CardDescription className="text-slate-dim">
                {STEP_TITLES[step]?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Organization Setup */}
              {step === 1 && (
                <OrgStep
                  orgData={orgData}
                  setOrgData={setOrgData}
                  onToggleTherapeuticArea={toggleTherapeuticArea}
                />
              )}

              {/* Step 2: Basic Information */}
              {step === 2 && (
                <ProfileStep register={form.register} errors={form.errors} />
              )}

              {/* Step 3: Education & Credentials */}
              {step === 3 && (
                <ExperienceStep
                  register={form.register}
                  education={form.education}
                  credentials={form.credentials}
                  onAddEducation={form.addEducation}
                  onRemoveEducation={form.removeEducation}
                  onAddCredential={form.addCredential}
                  onRemoveCredential={form.removeCredential}
                />
              )}

              {/* Step 4: Professional Experience */}
              {step === 4 && (
                <ProfessionalExperienceStep
                  register={form.register}
                  errors={form.errors}
                />
              )}

              {/* Step 5: Affiliations & Specializations */}
              {step === 5 && (
                <ReviewStep
                  organizationAffiliations={form.organizationAffiliations}
                  specializations={form.specializations}
                  showAffiliationInput={form.showAffiliationInput}
                  affiliationInput={form.affiliationInput}
                  onAffiliationInputChange={form.setAffiliationInput}
                  onAddAffiliation={form.addAffiliation}
                  onSaveAffiliation={form.saveAffiliation}
                  onRemoveAffiliation={form.removeAffiliation}
                  onCancelAffiliation={form.cancelAffiliation}
                  showSpecializationInput={form.showSpecializationInput}
                  specializationInput={form.specializationInput}
                  onSpecializationInputChange={form.setSpecializationInput}
                  onAddSpecialization={form.addSpecialization}
                  onSaveSpecialization={form.saveSpecialization}
                  onRemoveSpecialization={form.removeSpecialization}
                  onCancelSpecialization={form.cancelSpecialization}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || loading}
            >
              Previous
            </Button>

            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                {Object.keys(form.errors).length > 0 && (
                  <p className="text-sm text-destructive">
                    Please go back and fill in required fields (
                    {Object.keys(form.errors).join(", ")})
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
                >
                  {loading ? "Setting up..." : "Launch Your Platform"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
