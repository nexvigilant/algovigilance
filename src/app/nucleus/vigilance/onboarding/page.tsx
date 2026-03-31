import type { Metadata } from "next";
import { PvOnboarding } from "./components/pv-onboarding";

export const metadata: Metadata = {
  title: "Welcome to PV | AlgoVigilance",
  description:
    "Your guided introduction to pharmacovigilance — signal detection, causality assessment, and drug safety monitoring. No science degree required.",
};

export default function PvOnboardingPage() {
  return <PvOnboarding />;
}
