export interface TopEvent {
  event: string;
  count: number;
  prr: number;
  ror: number;
  ic025: number;
  chiSq: number;
  onLabel: boolean;
}

export interface SuseCandidate {
  event: string;
  verdict: "CRITICAL" | "HIGH" | "INVESTIGATE" | "CLEARED";
  prr: number;
  ror: number;
  ic025: number;
  chiSq: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface HuntResult {
  drug: string;
  rxcui?: string;
  topEvents: TopEvent[];
  suseCandidate: SuseCandidate[];
  conservationLaw: string;
}
