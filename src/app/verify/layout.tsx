import { createMetadata } from '@/lib/metadata';
import { PublicPageWrapper } from '@/components/layout';

export const metadata = createMetadata({
  title: 'Verify Capability',
  description: 'Verify the authenticity of AlgoVigilance Academy capability credentials.',
  path: '/verify',
});

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicPageWrapper networkOpacity={0.85} theme="guardian">
      {children}
    </PublicPageWrapper>
  );
}
