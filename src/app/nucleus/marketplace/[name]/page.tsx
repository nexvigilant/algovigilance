import { notFound } from "next/navigation";
import { getMicrogramDetail } from "../server";
import { MicrogramDetailView } from "./detail-view";

// Server component — reads real YAML from disk + runs rsk mcg test
// (source: ~/Projects/rsk-core/rsk/micrograms/, target/release/rsk)
export default async function MicrogramDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const mg = await getMicrogramDetail(decodedName);

  if (!mg) {
    notFound();
  }

  return <MicrogramDetailView mg={mg} />;
}
