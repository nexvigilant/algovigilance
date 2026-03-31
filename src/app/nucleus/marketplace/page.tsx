import { listMicrograms } from "./server";
import { MarketplaceBrowser } from "./browser";

// Server component — reads real YAML files from disk at request time
// (source: ~/Projects/rsk-core/rsk/micrograms/)
export default async function MarketplacePage() {
  const micrograms = await listMicrograms();
  return <MarketplaceBrowser micrograms={micrograms} />;
}
