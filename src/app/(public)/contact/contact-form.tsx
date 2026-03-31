"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Radar } from "lucide-react";
import { submitContactForm, type ContactFormData } from "./actions";
import { Honeypot } from "@/components/security/honeypot";
import {
  LEAD_SOURCES,
  HONEYPOT_FIELD_NAME,
  CONTACT_COMPANY_TYPES,
  SERVICE_INTEREST_LABELS,
  CONTACT_TIMELINE_LABELS,
  CONTACT_ROUTES,
} from "@/data/contact-forms";
import { FormWizard, type WizardStep } from "@/components/forms/form-wizard";

function RequiredIndicator() {
  return (
    <span
      className="text-red-400 ml-0.5 inline-flex items-center leading-normal"
      aria-hidden="true"
    >
      *
    </span>
  );
}

const initialFormData: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  companyType: "",
  serviceInterest: "",
  timeline: "",
  subject: "",
  message: "",
  source: "",
};

export function ContactForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<ContactFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSignalReferral, setIsSignalReferral] = useState(false);
  const [isBotDetected, setIsBotDetected] = useState(false);

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const sourceParam = searchParams.get("source");
    const refParam = searchParams.get("ref");

    if (refParam === "signal-validation") {
      setIsSignalReferral(true);
      setFormData((prev) => ({
        ...prev,
        serviceInterest: "signal-validation",
        subject: "Signal Validation Consultation Request",
        source: LEAD_SOURCES.INTELLIGENCE_SIGNAL,
      }));
      return;
    }

    if (serviceParam || sourceParam) {
      setFormData((prev) => ({
        ...prev,
        serviceInterest:
          serviceParam && serviceParam in SERVICE_INTEREST_LABELS
            ? (serviceParam as typeof prev.serviceInterest)
            : prev.serviceInterest,
        subject:
          serviceParam && serviceParam in SERVICE_INTEREST_LABELS
            ? `${SERVICE_INTEREST_LABELS[serviceParam as keyof typeof SERVICE_INTEREST_LABELS]} Inquiry`
            : prev.subject,
        source: sourceParam || prev.source,
      }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (isBotDetected) {
      setResult({ success: true, message: "Thank you for your message!" });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await submitContactForm(formData);
      setResult(response);
      if (response.success) {
        router.push(CONTACT_ROUTES.thankYou);
      }
    } catch {
      setResult({
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = async (
    _stepIndex: number,
    fields: string[],
  ): Promise<boolean> => {
    for (const field of fields) {
      const value = formData[field as keyof ContactFormData];
      if (field === "firstName" && !value) return false;
      if (field === "lastName" && !value) return false;
      if (field === "email" && !value) return false;
      if (field === "subject" && !value) return false;
      if (field === "message" && (!value || value.length < 10)) return false;
    }
    return true;
  };

  const steps: WizardStep[] = [
    {
      title: "About You",
      description: "Tell us who you are so we can get back to you.",
      fields: ["firstName", "lastName", "email"],
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name
                <RequiredIndicator />
              </Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                aria-required="true"
                disabled={isSubmitting}
                autoComplete="given-name"
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name
                <RequiredIndicator />
              </Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                aria-required="true"
                disabled={isSubmitting}
                autoComplete="family-name"
                maxLength={50}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email
              <RequiredIndicator />
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              aria-required="true"
              disabled={isSubmitting}
              autoComplete="email"
              maxLength={254}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Your Organization",
      description: "Help us understand your context. All fields optional.",
      fields: ["companyName", "companyType", "serviceInterest", "timeline"],
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Your organization"
              value={formData.companyName}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="organization"
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyType">Company Type</Label>
              <Select
                value={formData.companyType}
                onValueChange={(value) =>
                  handleSelectChange("companyType", value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="companyType">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTACT_COMPANY_TYPES).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceInterest">Service Interest</Label>
              <Select
                value={formData.serviceInterest}
                onValueChange={(value) =>
                  handleSelectChange("serviceInterest", value)
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="serviceInterest">
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_INTEREST_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Select
              value={formData.timeline}
              onValueChange={(value) => handleSelectChange("timeline", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="timeline">
                <SelectValue placeholder="When do you need help?" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTACT_TIMELINE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: "Your Message",
      description: "What can we help you with?",
      fields: ["subject", "message"],
      content: (
        <div className="space-y-4">
          {isSignalReferral && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <Radar
                  className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-semibold text-amber-300 text-sm mb-1">
                    Signal Validation Request
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Describe the signal and its potential impact. Our vigilance
                    intelligence experts will assess relevance and provide
                    strategic recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject
              <RequiredIndicator />
            </Label>
            <Input
              id="subject"
              name="subject"
              placeholder="General Inquiry"
              value={formData.subject}
              onChange={handleChange}
              required
              aria-required="true"
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">
              Message
              <RequiredIndicator />
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your needs..."
              className="min-h-[120px]"
              value={formData.message}
              onChange={handleChange}
              required
              aria-required="true"
              disabled={isSubmitting}
              maxLength={5000}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} method="POST">
      <Honeypot
        fieldName={HONEYPOT_FIELD_NAME}
        onBotDetected={() => setIsBotDetected(true)}
      />

      {/* Feedback */}
      <div aria-live="polite" aria-atomic="true" className="mb-4">
        {result &&
          (result.success ? (
            <Alert className="border-cyan bg-cyan/10 text-cyan" role="status">
              <CheckCircle2 className="h-4 w-4 text-cyan" aria-hidden="true" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ))}
      </div>

      <FormWizard
        steps={steps}
        onValidateStep={validateStep}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Send Message"
      />
    </form>
  );
}
