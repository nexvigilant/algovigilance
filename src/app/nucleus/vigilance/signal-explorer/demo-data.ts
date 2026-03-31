import type { HuntResult } from "./types";

export const DEMO_DATA: Record<string, HuntResult> = {
  dexlansoprazole: {
    drug: "dexlansoprazole",
    rxcui: "596541",
    topEvents: [
      {
        event: "Chronic Kidney Disease",
        count: 16100,
        prr: 134.4,
        ror: 221.4,
        ic025: 6.69,
        chiSq: 1678768,
        onLabel: false,
      },
      {
        event: "Acute Kidney Injury",
        count: 7791,
        prr: 62.1,
        ror: 89.3,
        ic025: 5.91,
        chiSq: 498432,
        onLabel: false,
      },
      {
        event: "Renal Failure",
        count: 6721,
        prr: 51.4,
        ror: 71.2,
        ic025: 5.67,
        chiSq: 341887,
        onLabel: false,
      },
      {
        event: "End-Stage Renal Disease",
        count: 4842,
        prr: 44.8,
        ror: 64.9,
        ic025: 5.46,
        chiSq: 216309,
        onLabel: false,
      },
      {
        event: "Renal Injury",
        count: 4339,
        prr: 38.1,
        ror: 53.4,
        ic025: 5.24,
        chiSq: 164872,
        onLabel: false,
      },
      {
        event: "Drug Ineffective",
        count: 2518,
        prr: 1.4,
        ror: 1.4,
        ic025: 0.42,
        chiSq: 1209,
        onLabel: true,
      },
      {
        event: "Fatigue",
        count: 2337,
        prr: 1.2,
        ror: 1.3,
        ic025: 0.21,
        chiSq: 744,
        onLabel: true,
      },
      {
        event: "Tubulointerstitial Nephritis",
        count: 2190,
        prr: 29.6,
        ror: 41.2,
        ic025: 4.87,
        chiSq: 63291,
        onLabel: true,
      },
    ],
    suseCandidate: [
      {
        event: "Chronic Kidney Disease",
        verdict: "CRITICAL",
        prr: 134.4,
        ror: 221.4,
        ic025: 6.69,
        chiSq: 1678768,
        a: 16103,
        b: 24687,
        c: 58658,
        d: 19907541,
      },
      {
        event: "Acute Kidney Injury",
        verdict: "HIGH",
        prr: 62.1,
        ror: 89.3,
        ic025: 5.91,
        chiSq: 498432,
        a: 7791,
        b: 33000,
        c: 62000,
        d: 19903000,
      },
      {
        event: "End-Stage Renal Disease",
        verdict: "HIGH",
        prr: 44.8,
        ror: 64.9,
        ic025: 5.46,
        chiSq: 216309,
        a: 4842,
        b: 36000,
        c: 65000,
        d: 19900000,
      },
    ],
    conservationLaw: `∃ = ∂(×(ς, ∅))

∂  Drug-event pair     : dexlansoprazole × Chronic Kidney Disease
ς  Observed state      : a=16,103 / b=24,687 / c=58,658 / d=19,907,541
∅  Label (void)        : "Acute Tubulointerstitial Nephritis" only
                         CKD, AKI, ESRD NOT listed

∃  Signal exists       : PRR=134.4 ≥ 2.0  ✓
                         ROR=221.4 (CI>1)  ✓
                         IC025=6.69 > 0    ✓
                         chi²=1,678,768 ≥ 3.841 ✓

SUSE verdict           : CRITICAL — strong signal, not on label
ICH E2A implication    : 15-day expedited reporting required
                         if causally associated`,
  },

  vonoprazan: {
    drug: "vonoprazan",
    rxcui: "1860484",
    topEvents: [
      {
        event: "Diarrhoea",
        count: 382,
        prr: 1.8,
        ror: 1.9,
        ic025: 0.71,
        chiSq: 312,
        onLabel: true,
      },
      {
        event: "Drug Ineffective",
        count: 374,
        prr: 1.3,
        ror: 1.4,
        ic025: 0.33,
        chiSq: 198,
        onLabel: true,
      },
      {
        event: "Nausea",
        count: 349,
        prr: 1.6,
        ror: 1.7,
        ic025: 0.62,
        chiSq: 244,
        onLabel: true,
      },
      {
        event: "Interstitial Lung Disease",
        count: 181,
        prr: 12.9,
        ror: 13.2,
        ic025: 3.47,
        chiSq: 1964,
        onLabel: false,
      },
      {
        event: "Pneumonia",
        count: 165,
        prr: 4.2,
        ror: 4.4,
        ic025: 2.01,
        chiSq: 543,
        onLabel: false,
      },
      {
        event: "Abdominal Pain",
        count: 148,
        prr: 1.4,
        ror: 1.5,
        ic025: 0.38,
        chiSq: 121,
        onLabel: true,
      },
    ],
    suseCandidate: [
      {
        event: "Interstitial Lung Disease",
        verdict: "HIGH",
        prr: 12.9,
        ror: 13.2,
        ic025: 3.47,
        chiSq: 1964,
        a: 181,
        b: 2819,
        c: 8100,
        d: 19994900,
      },
      {
        event: "Pneumonia",
        verdict: "INVESTIGATE",
        prr: 4.2,
        ror: 4.4,
        ic025: 2.01,
        chiSq: 543,
        a: 165,
        b: 2835,
        c: 22400,
        d: 19980000,
      },
    ],
    conservationLaw: `∃ = ∂(×(ς, ∅))

∂  Drug-event pair     : vonoprazan × Interstitial Lung Disease
ς  Observed state      : a=181 / b=2,819 / c=8,100 / d=19,994,900
∅  Label (void)        : Diarrhoea, Nausea, Drug Ineffective listed
                         ILD NOT listed

∃  Signal exists       : PRR=12.9 ≥ 2.0   ✓
                         ROR=13.2 (CI>1)   ✓
                         IC025=3.47 > 0    ✓
                         chi²=1,964 ≥ 3.841 ✓

SUSE verdict           : HIGH — meaningful signal, unexpected
ICH E2A implication    : 15-day expedited reporting required
                         if causally associated`,
  },
};
