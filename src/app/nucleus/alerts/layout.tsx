import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Alerts & Compliance",
  description:
    "Healthcare compliance monitoring, adverse event alerts, equipment calibration, vendor risk management, and regulatory compliance tracking.",
  path: "/nucleus/alerts",
});

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
