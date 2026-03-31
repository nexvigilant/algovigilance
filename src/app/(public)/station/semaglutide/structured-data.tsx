/**
 * JSON-LD Structured Data for Semaglutide Signal Investigation
 *
 * Helps Google understand this is a medical research article with
 * specific drug safety data. Targets "semaglutide side effects",
 * "semaglutide pancreatitis", "semaglutide safety" queries.
 */

export function SemaglutideStructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "Semaglutide Signal Investigation — Pharmacovigilance Worked Example",
    description:
      "Step-by-step pharmacovigilance signal investigation for semaglutide and pancreatitis using live FDA FAERS data, PRR/ROR/IC/EBGM disproportionality analysis, DailyMed labeling review, and PubMed literature search.",
    url: "https://algovigilance.com/station/semaglutide",
    datePublished: "2026-03-26",
    dateModified: "2026-03-31",
    author: {
      "@type": "Organization",
      name: "AlgoVigilance",
      url: "https://algovigilance.com",
    },
    publisher: {
      "@type": "Organization",
      name: "AlgoVigilance",
      url: "https://algovigilance.com",
      logo: {
        "@type": "ImageObject",
        url: "https://algovigilance.com/logo.png",
      },
    },
    about: {
      "@type": "Drug",
      name: "Semaglutide",
      alternateName: ["Ozempic", "Wegovy", "Rybelsus"],
      activeIngredient: "Semaglutide",
      drugClass: "GLP-1 receptor agonist",
    },
    mainEntity: {
      "@type": "MedicalCondition",
      name: "Pancreatitis",
      associatedAnatomy: {
        "@type": "AnatomicalStructure",
        name: "Pancreas",
      },
    },
    specialty: {
      "@type": "MedicalSpecialty",
      name: "Pharmacovigilance",
    },
    keywords: [
      "semaglutide safety",
      "semaglutide side effects",
      "semaglutide pancreatitis",
      "GLP-1 adverse events",
      "pharmacovigilance signal detection",
      "PRR ROR disproportionality",
      "FDA FAERS analysis",
      "drug safety signal",
      "Ozempic side effects",
      "Wegovy safety profile",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
