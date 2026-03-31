import { createMetadata } from "@/lib/metadata";
import { AuditTrail } from "./components/audit-trail";

export const metadata = createMetadata({
  title: "Case History | AlgoVigilance Vigilance",
  description:
    "See exactly what happened, when, and why — complete audit trails for every safety case through the pharmacovigilance lifecycle",
  path: "/nucleus/vigilance/audit",
  keywords: [
    "audit trail",
    "case history",
    "pharmacovigilance",
    "ICSR",
    "traceability",
    "FSM",
    "timeline",
  ],
});

export default function AuditPage() {
  return <AuditTrail />;
}
