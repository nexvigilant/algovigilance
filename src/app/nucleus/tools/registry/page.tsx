import { RegistryHud } from './components/registry-hud';

export const metadata = {
  title: 'Registry HUD | AlgoVigilance Tools',
  description: 'Monitor Kellnr crate registry status and artifact lifecycle events',
};

export default function RegistryPage() {
  return <RegistryHud />;
}
