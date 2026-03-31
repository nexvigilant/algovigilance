import { NucleusBreadcrumbs } from '@/components/layout/navigation';
import { createMetadata } from '@/lib/metadata';
import { GlassNav } from './components/glass-nav';

export const metadata = createMetadata({
  title: 'Glass',
  description:
    'Practice pharmacovigilance with real data. The bridge between learning and doing.',
  path: '/nucleus/glass',
});

export default function GlassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <GlassNav />
      <main className="min-w-0">
        <div className="container mx-auto px-4 py-6 md:px-6">
          <NucleusBreadcrumbs className="mb-6" />
          {children}
        </div>
      </main>
    </div>
  );
}
