/**
 * Series Configuration
 *
 * Defines content series for the Intelligence hub.
 * Used by both the series landing pages and article pages.
 */

export interface SeriesConfig {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  /** All slugs that belong to this series, organized by section */
  sections: {
    title: string;
    description: string;
    icon: 'signal' | 'field-note' | 'perspective' | 'publication';
    slugs: string[];
  }[];
  sources: {
    title: string;
    url: string;
  }[];
  cta: {
    title: string;
    description: string;
    href: string;
    label: string;
  };
}

/** All available series */
export const SERIES_CONFIG: Record<string, SeriesConfig> = {
  'anatomy-of-regulatory-capture': {
    slug: 'anatomy-of-regulatory-capture',
    title: 'Anatomy of Regulatory Capture',
    subtitle: 'The McKinsey/FDA Case Study',
    description:
      'A comprehensive examination of how structural conflicts of interest compromised pharmaceutical safety oversight during the opioid epidemic. This series documents the mechanisms, impacts, and lessons from one of the most significant regulatory failures in modern pharmaceutical history.',
    heroImage: '/images/intelligence/generated/regulatory-capture-masterclass.png',
    heroImageAlt: 'Abstract navy structure with teal patterns depicting systemic tension',
    sections: [
      {
        title: 'Intel Signals',
        description:
          'Quick intelligence alerts highlighting key findings from the Congressional investigation.',
        icon: 'signal',
        slugs: [
          'mckinsey-dual-client-conflict',
          'mckinsey-document-destruction',
          'mckinsey-access-monetization',
        ],
      },
      {
        title: 'From the Field',
        description:
          'Practical guidance for recognizing and preventing conflicts of interest in your organization.',
        icon: 'field-note',
        slugs: ['recognizing-conflicts-of-interest', 'ethical-boundaries-consulting'],
      },
      {
        title: 'Deep Dives',
        description:
          'Strategic analysis examining how structural conflicts become institutionalized.',
        icon: 'perspective',
        slugs: ['anatomy-of-regulatory-capture', 'why-independence-matters'],
      },
      {
        title: 'The Complete Case Study',
        description:
          'Our comprehensive publication documenting the full scope of the McKinsey/FDA conflict.',
        icon: 'publication',
        slugs: ['regulatory-capture-masterclass'],
      },
    ],
    sources: [
      {
        title: 'House Oversight Committee Report',
        url: 'https://oversightdemocrats.house.gov/news/press-releases/committee-releases-report-uncovering-significant-conflicts-of-interest-at',
      },
      {
        title: 'DOJ Criminal Resolution',
        url: 'https://www.justice.gov/archives/opa/pr/justice-department-announces-resolution-criminal-and-civil-investigations-mckinsey-companys',
      },
      {
        title: 'UCSF/Johns Hopkins Document Archive',
        url: 'https://www.industrydocuments.ucsf.edu/opioids/collections/mckinsey-documents/',
      },
      {
        title: 'Massachusetts AG Settlement',
        url: 'https://www.mass.gov/news/ags-office-secures-573-million-settlement-with-mckinsey-for-turbocharging-opioid-sales-and-profiting-from-the-epidemic',
      },
    ],
    cta: {
      title: 'Need conflict-free oversight?',
      description:
        'AlgoVigilance provides independent vigilance intelligence without the structural conflicts that compromised FDA oversight.',
      href: '/contact?ref=series-regulatory-capture',
      label: 'Learn About Our Approach',
    },
  },
};

/**
 * Get all slugs that belong to any series
 */
export function getAllSeriesSlugs(): Set<string> {
  const slugs = new Set<string>();
  Object.values(SERIES_CONFIG).forEach((series) => {
    series.sections.forEach((section) => {
      section.slugs.forEach((slug) => slugs.add(slug));
    });
  });
  return slugs;
}

/**
 * Find which series a slug belongs to (if any)
 */
export function getSeriesForSlug(slug: string): SeriesConfig | null {
  for (const series of Object.values(SERIES_CONFIG)) {
    for (const section of series.sections) {
      if (section.slugs.includes(slug)) {
        return series;
      }
    }
  }
  return null;
}

/**
 * Get all series slugs for static generation
 */
export function getAllSeriesKeys(): string[] {
  return Object.keys(SERIES_CONFIG);
}

/**
 * Get flat list of all slugs in a series in order
 */
export function getSeriesSlugsInOrder(seriesSlug: string): string[] {
  const series = SERIES_CONFIG[seriesSlug];
  if (!series) return [];

  return series.sections.flatMap((section) => section.slugs);
}

/**
 * Get previous and next articles in a series
 */
export function getPrevNextInSeries(
  slug: string,
  seriesSlug: string
): { prev: string | null; next: string | null } {
  const allSlugs = getSeriesSlugsInOrder(seriesSlug);
  const currentIndex = allSlugs.indexOf(slug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? allSlugs[currentIndex - 1] : null,
    next: currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null,
  };
}

/**
 * Get position of an article in a series (1-indexed)
 */
export function getPositionInSeries(
  slug: string,
  seriesSlug: string
): { position: number; total: number } | null {
  const allSlugs = getSeriesSlugsInOrder(seriesSlug);
  const index = allSlugs.indexOf(slug);

  if (index === -1) {
    return null;
  }

  return {
    position: index + 1,
    total: allSlugs.length,
  };
}
