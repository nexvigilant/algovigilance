"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AdvisorApplicationSchema,
  type AdvisorApplication,
  expertiseLabels,
  consultingInterestLabels,
  specializationOptions,
  referralSourceLabels,
} from "@/lib/schemas/affiliate";
import { submitAdvisorApplication } from "../actions";
import {
  ContactInfoFields,
  MotivationField,
  CheckboxGroupField,
  FormSuccessState,
  FormErrorAlert,
  FormFooterTerms,
} from "../components/shared-form-fields";
import { FormWizard, type WizardStep } from "@/components/forms/form-wizard";

export function AdvisorForm() {
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<AdvisorApplication>({
    resolver: zodResolver(AdvisorApplicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      linkedInProfile: "",
      currentRole: "",
      currentCompany: "",
      yearsOfExperience: undefined,
      areaOfExpertise: undefined,
      specializations: [],
      consultingInterest: undefined,
      motivation: "",
      referralSource: undefined,
      source: "grow_advisor",
    },
  });

  const onSubmit = (data: AdvisorApplication) => {
    setSubmitResult(null);
    startTransition(async () => {
      const result = await submitAdvisorApplication(data);
      setSubmitResult(result);
      if (result.success) {
        form.reset();
      }
    });
  };

  const validateStep = async (
    _stepIndex: number,
    fields: string[],
  ): Promise<boolean> => {
    return form.trigger(fields as (keyof AdvisorApplication)[]);
  };

  if (submitResult?.success) {
    return <FormSuccessState message={submitResult.message} variant="gold" />;
  }

  const steps: WizardStep[] = [
    {
      title: "About You",
      description: "Your contact information.",
      fields: ["firstName", "lastName", "email", "linkedInProfile"],
      content: (
        <ContactInfoFields
          control={form.control}
          emailPlaceholder="you@company.com"
          linkedInDescription="Highly recommended for professional verification"
        />
      ),
    },
    {
      title: "Your Experience",
      description: "Tell us about your professional background.",
      fields: [
        "currentRole",
        "currentCompany",
        "yearsOfExperience",
        "areaOfExpertise",
      ],
      content: (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Role *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior PV Scientist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company *</FormLabel>
                  <FormControl>
                    <Input placeholder="Current employer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="yearsOfExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    max={50}
                    placeholder="Minimum 2 years"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  FTE experience in pharmaceutical/healthcare industry
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="areaOfExpertise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Area of Expertise *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary area" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(expertiseLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      title: "Your Goals",
      description: "How you want to contribute and grow.",
      fields: ["specializations", "consultingInterest", "motivation"],
      content: (
        <div className="space-y-4">
          <CheckboxGroupField
            control={form.control}
            name="specializations"
            label="Specializations"
            description="Select all areas where you have deep expertise"
            options={specializationOptions}
          />
          <FormField
            control={form.control}
            name="consultingInterest"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consulting Interest Level *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your interest level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(consultingInterestLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  How frequently would you like to engage in consulting?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <MotivationField
            control={form.control}
            label="Why do you want to join the Advisor Program?"
            placeholder="Share your expertise, what you hope to contribute, and how you see yourself growing with AlgoVigilance..."
          />
          <FormField
            control={form.control}
            name="referralSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How did you hear about us?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(referralSourceLabels).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {submitResult && !submitResult.success && (
          <FormErrorAlert message={submitResult.message} />
        )}

        <FormWizard
          steps={steps}
          onValidateStep={validateStep}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isPending}
          submitLabel="Submit Application"
        />

        <FormFooterTerms variant="gold" />
      </form>
    </Form>
  );
}
