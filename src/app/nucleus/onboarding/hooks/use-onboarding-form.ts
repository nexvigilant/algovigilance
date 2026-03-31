"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CompleteOnboardingInputSchema,
  type CompleteOnboardingInput,
} from "@/lib/schemas/firestore";

export function useOnboardingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CompleteOnboardingInput>({
    resolver: zodResolver(CompleteOnboardingInputSchema),
    defaultValues: {
      education: [],
      credentials: [],
      organizationAffiliations: [],
      specializations: [],
    },
  });

  // Watch array fields
  const education = watch("education") || [];
  const credentials = watch("credentials") || [];
  const organizationAffiliations = watch("organizationAffiliations") || [];
  const specializations = watch("specializations") || [];

  // Watch required fields
  const name = watch("name");

  // Inline input states for affiliations & specializations
  const [showAffiliationInput, setShowAffiliationInput] = useState(false);
  const [affiliationInput, setAffiliationInput] = useState("");
  const [showSpecializationInput, setShowSpecializationInput] = useState(false);
  const [specializationInput, setSpecializationInput] = useState("");

  // --- Array CRUD helpers ---

  function addEducation() {
    setValue("education", [
      ...education,
      {
        institution: "",
        degree: "",
        fieldOfStudy: "",
        graduationYear: undefined,
      },
    ]);
  }

  function removeEducation(index: number) {
    setValue(
      "education",
      education.filter((_, i) => i !== index),
    );
  }

  function addCredential() {
    setValue("credentials", [
      ...credentials,
      { name: "", issuingOrganization: "", issueDate: "", credentialId: "" },
    ]);
  }

  function removeCredential(index: number) {
    setValue(
      "credentials",
      credentials.filter((_, i) => i !== index),
    );
  }

  function addAffiliation() {
    setShowAffiliationInput(true);
  }

  function saveAffiliation() {
    if (affiliationInput.trim()) {
      setValue("organizationAffiliations", [
        ...organizationAffiliations,
        affiliationInput.trim(),
      ]);
      setAffiliationInput("");
      setShowAffiliationInput(false);
    }
  }

  function removeAffiliation(index: number) {
    setValue(
      "organizationAffiliations",
      organizationAffiliations.filter((_, i) => i !== index),
    );
  }

  function cancelAffiliation() {
    setShowAffiliationInput(false);
    setAffiliationInput("");
  }

  function addSpecialization() {
    setShowSpecializationInput(true);
  }

  function saveSpecialization() {
    if (specializationInput.trim()) {
      setValue("specializations", [
        ...specializations,
        specializationInput.trim(),
      ]);
      setSpecializationInput("");
      setShowSpecializationInput(false);
    }
  }

  function removeSpecialization(index: number) {
    setValue(
      "specializations",
      specializations.filter((_, i) => i !== index),
    );
  }

  function cancelSpecialization() {
    setShowSpecializationInput(false);
    setSpecializationInput("");
  }

  return {
    // Form primitives
    register,
    handleSubmit,
    errors,

    // Watched scalars
    name,

    // Watched arrays
    education,
    credentials,
    organizationAffiliations,
    specializations,

    // Education CRUD
    addEducation,
    removeEducation,

    // Credential CRUD
    addCredential,
    removeCredential,

    // Affiliation CRUD + inline input state
    showAffiliationInput,
    affiliationInput,
    setAffiliationInput,
    addAffiliation,
    saveAffiliation,
    removeAffiliation,
    cancelAffiliation,

    // Specialization CRUD + inline input state
    showSpecializationInput,
    specializationInput,
    setSpecializationInput,
    addSpecialization,
    saveSpecialization,
    removeSpecialization,
    cancelSpecialization,
  };
}
