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
  AmbassadorApplicationSchema,
  type AmbassadorApplication,
  programOfStudyLabels,
  currentRoleLabels,
  expertiseLabels,
  careerInterestOptions,
} from "@/lib/schemas/affiliate";
import { submitAmbassadorApplication } from "../actions";
import {
  ContactInfoFields,
  MotivationField,
  CheckboxGroupField,
  FormSuccessState,
  FormErrorAlert,
  FormFooterTerms,
} from "../components/shared-form-fields";
import { FormWizard, type WizardStep } from "@/components/forms/form-wizard";

export function AmbassadorForm() {
  const [isPending, startTransition] = useTransition();
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<AmbassadorApplication>({
    resolver: zodResolver(AmbassadorApplicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      linkedInProfile: "",
      currentRole: undefined,
      programOfStudy: undefined,
      institutionName: "",
      graduationDate: "",
      areaOfExpertise: undefined,
      careerInterests: [],
      motivation: "",
      source: "grow_ambassador",
    },
  });

  const onSubmit = (data: AmbassadorApplication) => {
    setSubmitResult(null);
    startTransition(async () => {
      const result = await submitAmbassadorApplication(data);
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
    return form.trigger(fields as (keyof AmbassadorApplication)[]);
  };

  if (submitResult?.success) {
    return <FormSuccessState message={submitResult.message} variant="cyan" />;
  }

  const steps: WizardStep[] = [
    {
      title: "About You",
      description: "Your contact information.",
      fields: ["firstName", "lastName", "email", "linkedInProfile"],
      content: <ContactInfoFields control={form.control} />,
    },
    {
      title: "Your Background",
      description: "Education and current status.",
      fields: [
        "currentRole",
        "programOfStudy",
        "institutionName",
        "graduationDate",
      ],
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="currentRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your current status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(currentRoleLabels).map(([value, label]) => (
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
          <FormField
            control={form.control}
            name="programOfStudy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Program of Study *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(programOfStudyLabels).map(
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
          <FormField
            control={form.control}
            name="institutionName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="University or institution name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="graduationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Graduation Date *</FormLabel>
                <FormControl>
                  <Input type="month" placeholder="YYYY-MM" {...field} />
                </FormControl>
                <FormDescription>
                  Expected or actual graduation date
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ),
    },
    {
      title: "Why AlgoVigilance",
      description: "Your interests and motivation.",
      fields: ["areaOfExpertise", "careerInterests", "motivation"],
      content: (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="areaOfExpertise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Area of Interest *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary interest" />
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
          <CheckboxGroupField
            control={form.control}
            name="careerInterests"
            label="Career Interests"
            description="Select all areas you're interested in exploring"
            options={careerInterestOptions}
          />
          <MotivationField
            control={form.control}
            label="Why do you want to join the Ambassador Program?"
            placeholder="Tell us about your goals, what you hope to gain, and how you can contribute to the AlgoVigilance community..."
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

        <FormFooterTerms variant="cyan" />
      </form>
    </Form>
  );
}
