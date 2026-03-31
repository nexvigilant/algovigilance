/**
 * Structured Data / JSON-LD Schema Components
 *
 * Canonical source for all Schema.org markup.
 * See: https://developers.google.com/search/docs/appearance/structured-data
 *
 * Note: dangerouslySetInnerHTML is safe here because we're using JSON.stringify
 * on our own config data (not user input) for JSON-LD structured data.
 */

import { SEO_CONFIG } from '@/data/seo-config';

export function OrganizationSchema() {
  const { organization } = SEO_CONFIG;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    legalName: organization.legalName,
    alternateName: organization.alternateName,
    url: organization.url,
    logo: organization.logo,
    description: organization.description,
    foundingDate: organization.foundingDate,
    founder: {
      '@type': 'Person',
      name: organization.founder.name,
      jobTitle: organization.founder.jobTitle,
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: organization.address.addressRegion,
      addressCountry: organization.address.addressCountry,
    },
    sameAs: organization.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: organization.contactEmail,
      url: organization.contactUrl,
      availableLanguage: 'English',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const { website, organization } = SEO_CONFIG;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: website.name,
    url: website.url,
    description: website.description,
    publisher: {
      '@type': 'Organization',
      name: organization.name,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${website.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
