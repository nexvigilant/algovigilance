'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  FolderOpen,
  Search,
  Tag,
  Calendar,
  Archive,
  Upload,
  ChevronRight,
} from 'lucide-react';
import {
  listDocuments,
  searchDocuments,
  type OrgDocument,
  type DocumentTag,
} from '@/lib/api/circles-org-api';

const TAG_STYLES: Record<DocumentTag, string> = {
  receipts: 'border-emerald-500/30 text-emerald-400',
  events: 'border-cyan/30 text-cyan',
  meetings: 'border-amber-500/30 text-amber-400',
  constitution: 'border-nex-gold-500/30 text-nex-gold-400',
  minutes: 'border-purple-500/30 text-purple-400',
  reports: 'border-blue-500/30 text-blue-400',
  templates: 'border-pink-500/30 text-pink-400',
  other: 'border-nex-light text-cyan-soft/50',
};

function DocumentRow({ doc }: { doc: OrgDocument }) {
  return (
    <div className="flex items-center gap-3 border-b border-nex-light/30 py-3 last:border-0">
      <FileText className={`h-5 w-5 shrink-0 ${doc.is_archived ? 'text-cyan-soft/30' : 'text-cyan'}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${doc.is_archived ? 'text-cyan-soft/40' : 'text-white'}`}>
          {doc.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {doc.folder_path && (
            <span className="flex items-center gap-0.5 text-[10px] text-cyan-soft/40">
              <FolderOpen className="h-3 w-3" />
              {doc.folder_path}
            </span>
          )}
          <span className="text-[10px] text-cyan-soft/40">
            v{doc.version}
          </span>
          {doc.academic_year && (
            <span className="flex items-center gap-0.5 text-[10px] text-cyan-soft/40">
              <Calendar className="h-3 w-3" />
              {doc.academic_year}
            </span>
          )}
          {doc.is_archived && (
            <Badge variant="outline" className="border-nex-light text-cyan-soft/40 text-[10px]">
              <Archive className="mr-0.5 h-3 w-3" /> archived
            </Badge>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {doc.tags.map((tag) => (
          <Badge key={tag} variant="outline" className={`text-[10px] ${TAG_STYLES[tag] ?? TAG_STYLES.other}`}>
            {tag}
          </Badge>
        ))}
        {doc.file_url && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan hover:text-cyan/80" asChild>
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
              Open <ChevronRight className="ml-0.5 h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function FolderGroup({ folderPath, docs }: { folderPath: string; docs: OrgDocument[] }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-cyan-soft/60 hover:text-cyan"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        {folderPath || 'Root'}
        <span className="text-cyan-soft/40">({docs.length})</span>
      </button>
      {!collapsed && (
        <Card className="border border-nex-light bg-nex-surface">
          {docs.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
        </Card>
      )}
    </div>
  );
}

// ── Main Documents Tab ────────────────────────

interface DocumentsTabProps {
  circleId: string;
}

export function DocumentsTab({ circleId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const filters: { tag?: string; academic_year?: string } = {};
    if (tagFilter !== 'all') filters.tag = tagFilter;
    if (yearFilter !== 'all') filters.academic_year = yearFilter;
    const res = await listDocuments(circleId, Object.keys(filters).length > 0 ? filters : undefined);
    if (res.data) setDocuments(res.data);
    setLoading(false);
  }, [circleId, tagFilter, yearFilter]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { void loadData(); return; }
    setIsSearching(true);
    const res = await searchDocuments(circleId, searchQuery.trim());
    if (res.data) setDocuments(res.data);
    setIsSearching(false);
  };

  const filtered = documents.filter((d) => showArchived || !d.is_archived);

  // Group by folder path
  const grouped = new Map<string, OrgDocument[]>();
  for (const doc of filtered) {
    const key = doc.folder_path || '';
    const existing = grouped.get(key) ?? [];
    existing.push(doc);
    grouped.set(key, existing);
  }
  const sortedFolders = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));

  // Unique years for filter
  const years = [...new Set(documents.map((d) => d.academic_year).filter(Boolean))].sort().reverse();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-16 animate-pulse border border-nex-light bg-nex-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-soft/40" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            className="h-8 border-nex-light bg-nex-surface pl-8 text-sm text-white placeholder:text-cyan-soft/40"
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="h-8 w-32 border-nex-light bg-nex-surface text-xs text-cyan-soft/60">
            <Tag className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {(Object.keys(TAG_STYLES) as DocumentTag[]).map((tag) => (
              <SelectItem key={tag} value={tag} className="text-xs capitalize">{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {years.length > 0 && (
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-8 w-28 border-nex-light bg-nex-surface text-xs text-cyan-soft/60">
              <Calendar className="mr-1 h-3 w-3" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y!} className="text-xs">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className={`h-8 text-xs ${showArchived ? 'text-cyan' : 'text-cyan-soft/40'}`}
        >
          <Archive className="mr-1 h-3.5 w-3.5" />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-cyan-soft/50">
        <span>{filtered.length} documents</span>
        <span>{grouped.size} folders</span>
        {isSearching && <span className="text-cyan">Searching...</span>}
      </div>

      {/* Folder Groups */}
      {sortedFolders.length > 0 ? (
        sortedFolders.map(([folder, docs]) => (
          <FolderGroup key={folder} folderPath={folder} docs={docs} />
        ))
      ) : (
        <Card className="border border-nex-light bg-nex-surface p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
          <p className="text-cyan-soft/60">No documents yet. Upload files to get started.</p>
        </Card>
      )}
    </div>
  );
}
