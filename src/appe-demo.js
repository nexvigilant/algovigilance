
const { runMicrogram, selfTest } = require("./lib/pdc/microgram-engine");
const { appeWeekGate } = require("./lib/pdc/appe-micrograms");

async function runDemo() {
  console.log("=== APPE Microgram Demo ===\n");

  // 1. Success Case
  const successInput = {
    current_week: 2,
    d1_score: 1.5,
    d2_score: 0.5,
    d3_score: 0.5,
    d14_score: 1.5,
  };

  const successResult = runMicrogram(appeWeekGate, successInput);
  console.log("--- SUCCESS CASE (Week 2) ---");
  console.log("Input:", JSON.stringify(successInput, null, 2));
  console.log("Output:", JSON.stringify(successResult.output, null, 2));
  console.log("Path Taken:", successResult.path.join(" -> "));
  console.log(`Duration: ${successResult.duration_us.toFixed(2)}μs\n`);

  // 2. Failure Case
  const failureInput = {
    current_week: 2,
    d1_score: 0.5, // Below L1 threshold
    d2_score: 0.5,
    d3_score: 0.5,
    d14_score: 1.5,
  };

  const failureResult = runMicrogram(appeWeekGate, failureInput);
  console.log("--- FAILURE CASE (Week 2 - Gap in D1) ---");
  console.log("Input:", JSON.stringify(failureInput, null, 2));
  console.log("Output:", JSON.stringify(failureResult.output, null, 2));
  console.log("Path Taken:", failureResult.path.join(" -> "));
  console.log(`Duration: ${failureResult.duration_us.toFixed(2)}μs\n`);

  // 3. Self-Test
  const report = selfTest(appeWeekGate);
  console.log("--- SELF-TEST REPORT ---");
  console.log(`Microgram: ${appeWeekGate.name}`);
  console.log(`Passed: ${report.passed}/${report.total}`);
  if (report.failed > 0) {
    console.log("Failures:", JSON.stringify(report.failures, null, 2));
  }
}

runDemo().catch(console.error);
