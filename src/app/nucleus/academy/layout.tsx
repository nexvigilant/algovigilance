import { AcademyTracker } from './components/academy-tracker';
import { AcademyNav } from './components/academy-nav';
import { NucleusBreadcrumbs } from '@/components/layout/navigation';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Academy',
  description:
    'Skills-based training programs and professional certification pathways for healthcare professionals.',
  path: '/nucleus/academy',
});

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AcademyTracker>
        {/* Horizontal Navigation Bar */}
        <AcademyNav />

        {/* Main Content Area */}
        <main className="min-w-0">
          <div className="container mx-auto px-4 py-6 md:px-6">
            {/* Breadcrumbs positioned AFTER AcademyNav orientation bar */}
            <NucleusBreadcrumbs className="mb-6" />
            {children}
          </div>
        </main>
      </AcademyTracker>
    </div>
  );
}
