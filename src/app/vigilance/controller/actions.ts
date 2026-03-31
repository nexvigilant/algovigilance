"use server";

import { readFile } from "fs/promises";
import { join } from "path";

const SETTINGS_PATH = join(
  process.env.HOME ?? "/home/matthew",
  ".claude/settings.json"
);
const FIDELITY_PATH = join(
  process.env.HOME ?? "/home/matthew",
  ".claude/hooks/state/cybercinetics/fidelity.json"
);
const HISTORY_PATH = join(
  process.env.HOME ?? "/home/matthew",
  ".claude/hooks/state/cybercinetics/history.jsonl"
);

export interface LiveBinding {
  hook: string;
  event: string;
  fidelity: number;
}

export interface FidelityPoint {
  ts: string;
  f_total: number;
  verdict: string;
  tier: string;
}

/** Read settings.json and fidelity ledger to build real binding list. */
export async function getBindings(): Promise<LiveBinding[]> {
  // Extract hooks from settings.json
  let hooks: { name: string; event: string }[] = [];
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(raw);
    const hookMap = settings?.hooks ?? {};
    for (const [event, entries] of Object.entries(hookMap)) {
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        const cmd = (entry as { command?: string }).command ?? "";
        if (!cmd || cmd.includes("cybercinetics-decay")) continue;
        const parts = cmd.replace("bash ", "").trim().split("/");
        const name = parts[parts.length - 1]?.split(" ")[0] ?? cmd.slice(0, 30);
        hooks.push({ name, event });
      }
    }
  } catch {
    return [];
  }

  // Read fidelity ledger for per-hook scores
  let fidelityMap: Record<string, number> = {};
  try {
    const raw = await readFile(FIDELITY_PATH, "utf-8");
    const ledger = JSON.parse(raw);
    const bindings = ledger?.bindings ?? {};
    for (const [key, data] of Object.entries(bindings)) {
      const f = (data as { fidelity?: number }).fidelity;
      if (typeof f === "number") fidelityMap[key] = f;
    }
  } catch {
    // No ledger yet — all hooks default to 1.0
  }

  return hooks.map((h) => ({
    hook: h.name,
    event: h.event,
    fidelity: fidelityMap[`${h.name}:${h.event}`] ?? 1.0,
  }));
}

/** Read F_total history from the JSONL the decay hook persists. */
export async function getFidelityHistory(): Promise<FidelityPoint[]> {
  try {
    const raw = await readFile(HISTORY_PATH, "utf-8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const d = JSON.parse(line);
        return {
          ts: d.ts ?? "",
          f_total: d.f_total ?? 0,
          verdict: d.verdict ?? "UNKNOWN",
          tier: d.tier ?? "T0",
        };
      })
      .slice(-30); // last 30 sessions
  } catch {
    return [];
  }
}
