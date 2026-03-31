import { createMetadata } from "@/lib/metadata";
import { CryptoDashboard } from "./components/crypto-dashboard";

export const metadata = createMetadata({
  title: "Crypto Infrastructure",
  description:
    "Cryptographic key health, signature coverage, backup freshness, and provenance tracking for AlgoVigilance data integrity",
  path: "/nucleus/vigilance/crypto",
  keywords: [
    "crypto",
    "encryption",
    "signing",
    "provenance",
    "data integrity",
    "21 CFR Part 11",
  ],
});

export default function CryptoPage() {
  return <CryptoDashboard />;
}
