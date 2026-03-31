import { createMetadata } from '@/lib/metadata';
import { CareersNav } from './components/careers-nav';

export const metadata = createMetadata({
  title: 'Careers',
  description: 'Track your skills, build your portfolio, and advance your pharmaceutical career.',
  path: '/nucleus/careers',
});

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Horizontal Navigation Bar */}
      <CareersNav />

      {/* Main Content Area */}
      <main className="min-w-0">
        <div className="container mx-auto px-4 py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
