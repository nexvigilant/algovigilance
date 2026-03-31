"use client";

import { useState, useEffect } from "react";
import type { PortfolioRiskResult } from "@/lib/pv-compute/portfolio";
import { Pill, ChevronDown, ChevronUp } from "lucide-react";

interface Product {
  brand_name: string;
  generic_name: string;
  route: string;
  pharmacologic_class: string;
  approval_year?: number;
}

interface PortfolioSectionProps {
  companyKey: string;
  companyName: string;
}

// Placeholder data while real MCP integration is wired
function getMockPortfolio(companyKey: string): Product[] {
  const portfolios: Record<string, Product[]> = {
    pfizer: [
      {
        brand_name: "Eliquis",
        generic_name: "apixaban",
        route: "Oral",
        pharmacologic_class: "Factor Xa Inhibitor",
        approval_year: 2012,
      },
      {
        brand_name: "Ibrance",
        generic_name: "palbociclib",
        route: "Oral",
        pharmacologic_class: "CDK4/6 Inhibitor",
        approval_year: 2015,
      },
      {
        brand_name: "Paxlovid",
        generic_name: "nirmatrelvir/ritonavir",
        route: "Oral",
        pharmacologic_class: "Protease Inhibitor",
        approval_year: 2021,
      },
      {
        brand_name: "Comirnaty",
        generic_name: "COVID-19 mRNA Vaccine",
        route: "Intramuscular",
        pharmacologic_class: "mRNA Vaccine",
        approval_year: 2021,
      },
      {
        brand_name: "Prevnar 20",
        generic_name: "pneumococcal 20-valent conjugate vaccine",
        route: "Intramuscular",
        pharmacologic_class: "Pneumococcal Vaccine",
        approval_year: 2021,
      },
      {
        brand_name: "Xtandi",
        generic_name: "enzalutamide",
        route: "Oral",
        pharmacologic_class: "Androgen Receptor Inhibitor",
        approval_year: 2012,
      },
    ],
    lilly: [
      {
        brand_name: "Mounjaro",
        generic_name: "tirzepatide",
        route: "Subcutaneous",
        pharmacologic_class: "GIP/GLP-1 Receptor Agonist",
        approval_year: 2022,
      },
      {
        brand_name: "Zepbound",
        generic_name: "tirzepatide",
        route: "Subcutaneous",
        pharmacologic_class: "GIP/GLP-1 Receptor Agonist",
        approval_year: 2023,
      },
      {
        brand_name: "Verzenio",
        generic_name: "abemaciclib",
        route: "Oral",
        pharmacologic_class: "CDK4/6 Inhibitor",
        approval_year: 2017,
      },
      {
        brand_name: "Taltz",
        generic_name: "ixekizumab",
        route: "Subcutaneous",
        pharmacologic_class: "IL-17A Antagonist",
        approval_year: 2016,
      },
      {
        brand_name: "Jardiance",
        generic_name: "empagliflozin",
        route: "Oral",
        pharmacologic_class: "SGLT2 Inhibitor",
        approval_year: 2014,
      },
    ],
    novonordisk: [
      {
        brand_name: "Ozempic",
        generic_name: "semaglutide",
        route: "Subcutaneous",
        pharmacologic_class: "GLP-1 Receptor Agonist",
        approval_year: 2017,
      },
      {
        brand_name: "Wegovy",
        generic_name: "semaglutide",
        route: "Subcutaneous",
        pharmacologic_class: "GLP-1 Receptor Agonist",
        approval_year: 2021,
      },
      {
        brand_name: "Rybelsus",
        generic_name: "semaglutide",
        route: "Oral",
        pharmacologic_class: "GLP-1 Receptor Agonist",
        approval_year: 2019,
      },
      {
        brand_name: "Victoza",
        generic_name: "liraglutide",
        route: "Subcutaneous",
        pharmacologic_class: "GLP-1 Receptor Agonist",
        approval_year: 2010,
      },
      {
        brand_name: "Tresiba",
        generic_name: "insulin degludec",
        route: "Subcutaneous",
        pharmacologic_class: "Long-Acting Insulin",
        approval_year: 2015,
      },
    ],
    merck: [
      {
        brand_name: "Keytruda",
        generic_name: "pembrolizumab",
        route: "Intravenous",
        pharmacologic_class: "PD-1 Blocker",
        approval_year: 2014,
      },
      {
        brand_name: "Januvia",
        generic_name: "sitagliptin",
        route: "Oral",
        pharmacologic_class: "DPP-4 Inhibitor",
        approval_year: 2006,
      },
      {
        brand_name: "Gardasil 9",
        generic_name: "HPV 9-valent vaccine",
        route: "Intramuscular",
        pharmacologic_class: "HPV Vaccine",
        approval_year: 2014,
      },
      {
        brand_name: "Winrevair",
        generic_name: "sotatercept",
        route: "Subcutaneous",
        pharmacologic_class: "Activin Receptor Type IIA-Fc Fusion",
        approval_year: 2024,
      },
    ],
  };

  if (portfolios[companyKey]) {
    return portfolios[companyKey];
  }

  // Generic fallback for other companies
  return [
    {
      brand_name: "Product A",
      generic_name: "compound-a",
      route: "Oral",
      pharmacologic_class: "Kinase Inhibitor",
      approval_year: 2018,
    },
    {
      brand_name: "Product B",
      generic_name: "compound-b",
      route: "Intravenous",
      pharmacologic_class: "Monoclonal Antibody",
      approval_year: 2019,
    },
    {
      brand_name: "Product C",
      generic_name: "compound-c",
      route: "Subcutaneous",
      pharmacologic_class: "Biologics",
      approval_year: 2020,
    },
  ];
}

export function PortfolioSection({
  companyKey,
  companyName,
}: PortfolioSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Simulate async fetch — real MCP tool: www_{company}_com_get_portfolio
    const timer = setTimeout(() => {
      setProducts(getMockPortfolio(companyKey));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [companyKey]);

  const displayed = showAll ? products : products.slice(0, 5);

  return (
    <section className="border border-white/[0.10] bg-white/[0.03]">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <Pill className="h-3.5 w-3.5 text-cyan/60" />
        <span className="intel-label">Approved Products</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
        {!loading && (
          <span className="text-[9px] font-mono text-slate-dim/40">
            {products.length} products
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-white/[0.04] animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      ) : (
        <>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {[
                  "Brand Name",
                  "Generic Name",
                  "Route",
                  "Pharmacologic Class",
                  "Year",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-[9px] font-mono uppercase tracking-widest text-slate-dim/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 text-xs font-semibold text-white">
                    {p.brand_name}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-dim/70">
                    {p.generic_name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 border border-white/[0.10] bg-white/[0.04] text-slate-dim/60">
                      {p.route}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-slate-dim/60">
                    {p.pharmacologic_class}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-dim/50 tabular-nums">
                    {p.approval_year ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono text-slate-dim/40 hover:text-slate-dim/70 border-t border-white/[0.06] transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show fewer
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show all {products.length} products
                </>
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
}
