// Marketplace types — shared between browse and detail pages.
// Source: microgram/mod.rs Microgram struct, decision_engine.rs Operator enum

export interface MicrogramListing {
  name: string;
  description: string;
  version: string;
  author: string;
  domain: string;
  nodeCount: number;
  testCount: number;
  operators: string[];
  hasInterface: boolean;
  downloads: number;
  verified: boolean;
  publishedAt: string;
}

export interface TreeNode {
  id: string;
  type: "condition" | "return";
  variable?: string;
  operator?: string;
  value?: string;
  trueNext?: string;
  falseNext?: string;
  returnValue?: Record<string, unknown>;
}

export interface TestCase {
  input: Record<string, unknown>;
  expect: Record<string, unknown>;
  passed: boolean;
}

export interface GateResult {
  name: string;
  passed: boolean;
  detail: string;
}

export interface MicrogramDetail extends MicrogramListing {
  nodes: TreeNode[];
  tests: TestCase[];
  gateResults: GateResult[];
}
