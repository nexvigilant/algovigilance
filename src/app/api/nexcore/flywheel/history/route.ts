import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const JSONL_PATH = join(
  homedir(),
  ".claude",
  "data",
  "flywheel-velocity.jsonl",
);
const MAX_RECORDS = 50;

export async function GET() {
  try {
    const raw = await readFile(JSONL_PATH, "utf-8");
    const lines = raw
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);

    const records = lines
      .slice(-MAX_RECORDS)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json(records);
  } catch {
    // File doesn't exist or is unreadable — return empty array
    return NextResponse.json([]);
  }
}
