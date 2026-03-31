import { NextResponse } from "next/server";
import { stationCall } from "@/lib/station";

export async function GET() {
  try {
    const data = await stationCall("crystalbook_nexvigilant_com_get_glossary");
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
