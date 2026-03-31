"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
const log = logger.scope("consulting-inquiry-form");
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import {
  submitConsultingInquiry,
  type ConsultingInquiryFormData,
} from "./actions";
import { Honeypot } from "@/components/security/honeypot";
import {
  HONEYPOT_FIELD_NAME,
  CONTACT_ROUTES,
  LEAD_SOURCES,
} from "@/data/contact-forms";
import {
  ContactInfoSection,
  CompanyInfoSection,
  ProjectDetailsSection,
} from "./consulting-form-sections";
import { FormWizard, type WizardStep } from "@/components/forms/form-wizard";

interface ConsultingInquiryFormProps {
  defaultCategory?: string;
  source?: string;
}

const VALID_CATEGORIES = [
  "strategic",
  "innovation",
  "ld",
  "tactical",
  "multiple",
] as const;

function isValidCategory(
  value: string | null,
): value is (typeof VALID_CATEGORIES)[number] {
  return (
    value !== null &&
    VALID_CATEGORIES.includes(value as (typeof VALID_CATEGORIES)[number])
  );
}

export function ConsultingInquiryForm({
  defaultCategory,
  source = LEAD_SOURCES.CONSULTING_PAGE,
}: ConsultingInquiryFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isBotDetected, setIsBotDetected] = useState(false);

  const categoryParam = searchParams.get("category");
  const initialCategory = isValidCategory(categoryParam)
    ? categoryParam
    : defaultCategory && isValidCategory(defaultCategory)
      ? defaultCategory
      : "";

  const [formData, setFormData] = useState<Partial<ConsultingInquiryFormData>>({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    companyName: "",
    companyType: undefined,
    companySize: undefined,
    consultingCategory:
      (initialCategory as ConsultingInquiryFormData["consultingCategory"]) ||
      undefined,
    functionalArea: undefined,
    budgetRange: undefined,
    timeline: undefined,
    challengeDescription: "",
    source: searchParams.get("source") || source,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (
    field: keyof ConsultingInquiryFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = async (
    _stepIndex: number,
    fields: string[],
  ): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = formData[field as keyof typeof formData];
      if (field === "firstName" && !value?.toString().trim())
        newErrors.firstName = "First name is required";
      if (field === "lastName" && !value?.toString().trim())
        newErrors.lastName = "Last name is required";
      if (field === "email") {
        if (!value?.toString().trim()) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString()))
          newErrors.email = "Please enter a valid email";
      }
      if (field === "companyName" && !value?.toString().trim())
        newErrors.companyName = "Company name is required";
      if (field === "companyType" && !value)
        newErrors.companyType = "Please select a company type";
      if (field === "companySize" && !value)
        newErrors.companySize = "Please select company size";
      if (field === "consultingCategory" && !value)
        newErrors.consultingCategory = "Please select a consulting service";
      if (field === "timeline" && !value)
        newErrors.timeline = "Please select a timeline";
      if (field === "challengeDescription") {
        if (!value?.toString().trim())
          newErrors.challengeDescription = "Please describe your challenge";
        else if (value.toString().trim().length < 20)
          newErrors.challengeDescription =
            "Please provide more detail (at least 20 characters)";
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (isBotDetected) {
      setResult({ success: true, message: "Thank you for your inquiry!" });
      return;
    }

    startTransition(async () => {
      try {
        const response = await submitConsultingInquiry(
          formData as ConsultingInquiryFormData,
        );
        setResult(response);
        if (response.success) {
          router.push(CONTACT_ROUTES.thankYou);
        }
      } catch (error) {
        log.error("Consulting inquiry submission failed:", error);
        setResult({
          success: false,
          message:
            "An unexpected error occurred. Please try again or contact us directly.",
        });
      }
    });
  };

  if (result?.success) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="pt-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle2
              className="h-8 w-8 text-green-400"
              aria-hidden="true"
            />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Inquiry Submitted
          </h3>
          <p className="text-slate-dim mb-6">{result.message}</p>
          <Button
            type="button"
            onClick={() => setResult(null)}
            variant="outline"
            className="border-cyan text-cyan hover:bg-cyan/10"
          >
            Submit Another Inquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const steps: WizardStep[] = [
    {
      title: "Your Contact Info",
      description: "How can we reach you?",
      fields: ["firstName", "lastName", "email"],
      content: (
        <ContactInfoSection
          formData={formData}
          onFieldChange={handleFieldChange}
          errors={errors}
          isPending={isPending}
        />
      ),
    },
    {
      title: "Your Organization",
      description: "Tell us about your company.",
      fields: ["companyName", "companyType", "companySize"],
      content: (
        <CompanyInfoSection
          formData={formData}
          onFieldChange={handleFieldChange}
          errors={errors}
          isPending={isPending}
        />
      ),
    },
    {
      title: "Your Challenge",
      description: "What do you need help with?",
      fields: ["consultingCategory", "timeline", "challengeDescription"],
      content: (
        <ProjectDetailsSection
          formData={formData}
          onFieldChange={handleFieldChange}
          errors={errors}
          isPending={isPending}
        />
      ),
    },
  ];

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan/10" aria-hidden="true">
            <Building2 className="h-5 w-5 text-cyan" />
          </div>
          <CardTitle className="text-xl text-white">
            Request Your Diagnosis
          </CardTitle>
        </div>
        <CardDescription className="text-slate-dim">
          Share your strategic context. We&apos;ll review your case and respond
          within 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()} method="POST">
          <Honeypot
            fieldName={HONEYPOT_FIELD_NAME}
            onBotDetected={() => setIsBotDetected(true)}
          />

          {result && !result.success && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 mb-4"
            >
              <AlertCircle
                className="h-4 w-4 text-red-400"
                aria-hidden="true"
              />
              <p className="text-sm text-red-400">{result.message}</p>
            </div>
          )}

          <FormWizard
            steps={steps}
            onValidateStep={validateStep}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            submitLabel="Request Diagnosis"
          />

          <p className="text-xs text-slate-dim text-center mt-4">
            By submitting, you agree to our privacy policy. We&apos;ll never
            share your information with third parties.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
