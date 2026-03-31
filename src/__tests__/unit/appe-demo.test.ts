import { runMicrogram, selfTest } from "../../lib/pdc/microgram-engine";
import { appeWeekGate } from "../../lib/pdc/appe-micrograms";

describe("APPE Microgram Demo", () => {
  it("should demonstrate a successful Week 2 progression (Phase 1)", () => {
    const input = {
      current_week: 2,
      d1_score: 1.5,
      d2_score: 0.5,
      d3_score: 0.5,
      d14_score: 1.5,
    };

    const result = runMicrogram(appeWeekGate, input);

    console.log("--- SUCCESS CASE (Week 2) ---");
    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("Output:", JSON.stringify(result.output, null, 2));
    console.log("Path Taken:", result.path.join(" -> "));
    console.log(`Duration: ${result.duration_us.toFixed(2)}μs`);

    expect(result.success).toBe(true);
    expect(result.output.status).toBe("PASS");
    expect(result.output.advance).toBe(true);
  });

  it("should demonstrate a failed progression due to a gap in D1 (Week 2)", () => {
    const input = {
      current_week: 2,
      d1_score: 0.5, // Below L1 threshold
      d2_score: 0.5,
      d3_score: 0.5,
      d14_score: 1.5,
    };

    const result = runMicrogram(appeWeekGate, input);

    console.log("\n--- FAILURE CASE (Week 2 - Gap in D1) ---");
    console.log("Input:", JSON.stringify(input, null, 2));
    console.log("Output:", JSON.stringify(result.output, null, 2));
    console.log("Path Taken:", result.path.join(" -> "));

    expect(result.success).toBe(true);
    expect(result.output.status).toBe("GAP");
    expect(result.output.advance).toBe(false);
    expect(result.output.gap_domain).toBe("D1");
  });

  it("should pass all built-in self-tests for appeWeekGate", () => {
    const report = selfTest(appeWeekGate);
    
    console.log("\n--- SELF-TEST REPORT ---");
    console.log(`Passed: ${report.passed}/${report.total}`);
    
    if (report.failed > 0) {
      console.log("Failures:", JSON.stringify(report.failures, null, 2));
    }

    expect(report.failed).toBe(0);
    expect(report.passed).toBeGreaterThan(0);
  });
});
