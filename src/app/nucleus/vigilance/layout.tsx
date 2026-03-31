import { createMetadata } from '@/lib/metadata';
import { GlossaryWidget } from '@/components/vigilance/glossary-widget';

export const metadata = createMetadata({
  title: 'Vigilance Suite',
  description: 'Harm prediction and prevention across drug safety, AI systems, and infrastructure. Signal detection, causality assessment, and cross-domain safety analytics.',
  path: '/nucleus/vigilance',
});

export default function VigilanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <GlossaryWidget />
    </>
  );
}
