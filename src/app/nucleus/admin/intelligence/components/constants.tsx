import { Mic, BookOpen, FileText, Newspaper, Radio } from 'lucide-react';
import type { ContentStatus, ContentType } from '@/types/intelligence';

export const STATUS_COLORS: Record<ContentStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  published: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  archived: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export const TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  podcast: <Mic className="h-4 w-4" />,
  publication: <BookOpen className="h-4 w-4" />,
  perspective: <FileText className="h-4 w-4" />,
  'field-note': <Newspaper className="h-4 w-4" />,
  signal: <Radio className="h-4 w-4" />,
};
