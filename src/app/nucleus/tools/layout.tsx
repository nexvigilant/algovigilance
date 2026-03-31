import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Tools',
  description: 'Vigilance analysis tools — signal detection, fuzzy matching, decision trees, and more.',
  path: '/nucleus/tools',
});

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
