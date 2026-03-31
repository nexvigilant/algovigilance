'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, Users, Lock } from 'lucide-react';
import { type Publication, listPublications } from '@/lib/api/circles-api';
import { COMMUNITY_ROUTES } from '@/lib/routes';

interface Props {
  publicationId: string;
}

const VISIBILITY_ICONS: Record<string, typeof Globe> = {
  Community: Globe,
  Circles: Users,
  Restricted: Lock,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function PublicationDetail({ publicationId }: Props) {
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listPublications();
    if (res.data) {
      const match = res.data.find((p) => p.id === publicationId) ?? null;
      if (match) {
        setPublication(match);
      } else {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [publicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  if (notFound || !publication) {
    return (
      <div>
        <BackLink />
        <Card className="mt-6 border border-nex-light bg-nex-surface p-12 text-center">
          <p className="mb-2 text-lg font-medium text-white">Publication not found</p>
          <p className="text-sm text-cyan-soft/60">
            This publication may have been removed or the link is incorrect.
          </p>
        </Card>
      </div>
    );
  }

  const VisIcon = VISIBILITY_ICONS[publication.visibility] ?? Globe;

  return (
    <div>
      <BackLink />

      <Card className="mt-6 border border-nex-light bg-nex-surface p-6">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="font-headline text-2xl font-bold text-white">
            {publication.title}
          </h1>
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-nex-light text-cyan-soft/60 text-xs"
          >
            <VisIcon className="h-3 w-3" />
            {publication.visibility}
          </Badge>
        </div>

        {/* Abstract */}
        <p className="mb-6 text-cyan-soft/80 leading-relaxed">
          {publication.abstract_text}
        </p>

        {/* Meta section */}
        <div className="border-t border-nex-light pt-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetaRow label="Published">
              {formatDate(publication.published_at)}
            </MetaRow>

            <MetaRow label="Published by">
              {truncate(publication.published_by, 40)}
            </MetaRow>

            <MetaRow label="Source circle">
              <Link
                href={COMMUNITY_ROUTES.circle(publication.source_circle_id)}
                className="text-cyan hover:text-cyan/80 transition-colors"
              >
                {truncate(publication.source_circle_id, 40)}
              </Link>
            </MetaRow>

            <MetaRow label="Deliverable">
              <span className="text-cyan-soft/40 text-xs">
                {truncate(publication.deliverable_id, 40)}
              </span>
            </MetaRow>
          </dl>
        </div>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href={COMMUNITY_ROUTES.PUBLICATIONS}
      className="inline-flex items-center gap-1.5 text-sm text-cyan hover:text-cyan/80 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Publications
    </Link>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-cyan-soft/40">{label}</dt>
      <dd className="text-sm text-cyan-soft/80">{children}</dd>
    </div>
  );
}
