import Link from 'next/link';
import { Loader2, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceLoading } from '@/components/voice';
import { MediaCard } from './media-card';

export interface IntelligenceItem {
  slug: string;
  title: string;
  type: string;
  image: string | null;
  imageAlt: string | null;
  publishedAt: string;
}

interface IntelligenceTabProps {
  items: IntelligenceItem[];
  missingCount: number;
  loading?: boolean;
  regenerating: string | null;
  bulkGenerating: 'intelligence' | 'academy' | null;
  onRegenerate: (slug: string) => void;
  onBulkGenerate: () => void;
  title: string;
  titleIconColor?: string;
  alwaysShowBulk?: boolean;
  bulkButtonLabel?: string;
  viewAllHref?: string;
  asSectionTag?: boolean;
}

export function IntelligenceTab({
  items,
  missingCount,
  loading = false,
  regenerating,
  bulkGenerating,
  onRegenerate,
  onBulkGenerate,
  title,
  titleIconColor,
  alwaysShowBulk = false,
  bulkButtonLabel,
  viewAllHref,
  asSectionTag = false,
}: IntelligenceTabProps) {
  const showBulkButton = alwaysShowBulk || missingCount > 0;
  const resolvedBulkLabel = bulkButtonLabel ?? `Generate All Missing (${missingCount})`;

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          {titleIconColor && <FileText className={`h-5 w-5 ${titleIconColor}`} />}
          {title}
        </h2>
        {showBulkButton && (
          <Button
            onClick={onBulkGenerate}
            disabled={bulkGenerating === 'intelligence'}
            size="sm"
          >
            {bulkGenerating === 'intelligence' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {resolvedBulkLabel}
              </>
            )}
          </Button>
        )}
      </div>
      {loading ? (
        <VoiceLoading context="admin" variant="spinner" message="Loading Intelligence content..." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <MediaCard
              key={item.slug}
              id={item.slug}
              title={item.title}
              type={item.type}
              image={item.image}
              imageAlt={item.imageAlt}
              isRegenerating={regenerating === `intelligence-${item.slug}`}
              onRegenerate={() => onRegenerate(item.slug)}
            />
          ))}
        </div>
      )}
      {viewAllHref && (
        <div className="mt-4 text-center">
          <Link href={viewAllHref}>
            <Button variant="outline">View All Intelligence Content</Button>
          </Link>
        </div>
      )}
    </>
  );

  if (asSectionTag) return <section>{content}</section>;
  return <>{content}</>;
}
