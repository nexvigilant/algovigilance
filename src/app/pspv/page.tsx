import { createMetadata } from '@/lib/metadata';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FoundingSignup } from './components/founding-signup';

export const metadata = createMetadata({
  title: 'Professional Society of Pharmacovigilance (PSPV)',
  description:
    'The first professional society built for the people who DO pharmacovigilance. Student membership free. 1,286-competency framework. AI-native from day one.',
  path: '/pspv',
  keywords: [
    'pharmacovigilance',
    'professional society',
    'PSPV',
    'PV practitioners',
    'drug safety',
    'signal detection',
    'QPPV',
    'safety writers',
  ],
});

// ─── Data ────────────────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  {
    org: 'ISoP',
    focus: 'Scientific research',
    audience: 'Academic researchers and scientists',
    members: '~1,500',
    pricing: 'Annual dues, tiered',
    note: 'Narrow scientific scope; practitioner operations underserved.',
  },
  {
    org: 'DIA',
    focus: 'Broad pharma industry',
    audience: 'Drug development professionals across all disciplines',
    members: '20,000+',
    pricing: 'High enterprise pricing',
    note: 'PV is one topic among many; no practitioner-specific depth.',
  },
  {
    org: 'RAPS',
    focus: 'Regulatory affairs',
    audience: 'Regulatory professionals',
    members: '11,000+',
    pricing: 'Annual dues, tiered',
    note: 'Safety science tangential; regulatory submissions primary focus.',
  },
  {
    org: 'PSPV',
    focus: 'Pharmacovigilance practice',
    audience:
      'Case processors, signal analysts, QPPV deputies, safety writers, students',
    members: 'Founding now',
    pricing: '$0 students / $49–$999',
    note: 'Built for practitioners. AI-native. 1,286-competency KSB framework.',
    highlight: true,
  },
];

const MEMBERSHIP_TIERS = [
  {
    name: 'Student',
    price: '$0',
    period: 'per year',
    badge: 'Free Forever',
    highlight: true,
    eligibility: 'Students in pharmacy, medicine, public health.',
    includes: [
      'Full Academy access',
      'Community and peer network',
      'Mentorship matching',
      'Student chapter participation',
    ],
  },
  {
    name: 'Associate',
    price: '$49',
    period: 'per year',
    badge: null,
    highlight: false,
    eligibility: 'Early-career professionals (fewer than 3 years in PV).',
    includes: [
      'Academy and community access',
      'PV job board',
      'One certification exam per year',
      'Quarterly networking events',
    ],
  },
  {
    name: 'Professional',
    price: '$149',
    period: 'per year',
    badge: null,
    highlight: false,
    eligibility: 'Practicing PV professionals.',
    includes: [
      'SOP library access',
      'Full tool suite',
      'Discounted conference rate',
      'Voting rights on PSPV governance',
    ],
  },
  {
    name: 'Fellow (FPSPV)',
    price: '$249',
    period: 'per year',
    badge: null,
    highlight: false,
    eligibility: 'Professionals with 10 or more years of PV experience.',
    includes: [
      'Committee leadership eligibility',
      'Publication co-authorship opportunities',
      'Formal mentor role in the network',
      'FPSPV designation and credential',
    ],
  },
  {
    name: 'Organizational',
    price: '$999',
    period: 'per year',
    badge: null,
    highlight: false,
    eligibility: 'Companies with pharmacovigilance departments.',
    includes: [
      'Five Professional-tier seats',
      'SOP template library',
      'Compliance tools and resources',
      'Employer branding in job board',
    ],
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PSPVPage() {
  return (
    <div className="min-h-screen bg-nex-background text-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 px-4 overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <Badge className="mb-6 bg-cyan/10 text-cyan border-cyan/30 text-sm font-medium px-4 py-1.5">
            501(c)(6) — Delaware Incorporation Pending
          </Badge>

          <h1
            id="hero-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-white mb-4 leading-tight"
          >
            Professional Society of Pharmacovigilance
          </h1>

          <p className="text-2xl md:text-3xl font-headline text-cyan mb-6 font-semibold tracking-wide">
            PSPV — Where PV Practitioners Belong
          </p>

          <p className="text-lg text-slate-300 italic mb-8">
            PV knowledge belongs to everyone.
          </p>

          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The first professional society built for the people who DO
            pharmacovigilance — case processors, signal analysts, QPPV deputies,
            safety writers, and the next generation entering the field. We exist
            because 50,000+ PV practitioners deserve a professional home.
          </p>
        </div>
      </section>

      {/* ── Guardian Angel Mission ────────────────────────────────────────── */}
      <section
        className="py-20 px-4 bg-white/[0.03] border-y border-white/[0.08]"
        aria-labelledby="guardian-heading"
      >
        <div className="container mx-auto max-w-3xl">
          <h2
            id="guardian-heading"
            className="text-2xl md:text-3xl font-headline font-bold text-white text-center mb-10 uppercase tracking-wide"
          >
            The Guardian Angel Mission
          </h2>

          <blockquote
            className="relative rounded-2xl border border-cyan/30 bg-gradient-to-br from-cyan/10 via-white/[0.04] to-white/[0.04] p-8 md:p-12"
            cite="https://algovigilance.net/pspv"
          >
            <div
              className="absolute top-6 left-8 text-cyan/20 font-headline text-7xl leading-none select-none"
              aria-hidden="true"
            >
              &ldquo;
            </div>
            <div className="relative z-10 space-y-4 text-slate-200 text-base md:text-lg leading-relaxed">
              <p>
                Pharmacovigilance knowledge belongs to everyone. Not locked
                behind enterprise paywalls. Not gatekept by conference fees. Not
                restricted to those who already have access.
              </p>
              <p>
                Every patient who takes a medication deserves a workforce trained
                to protect them — and every person drawn to that mission deserves
                the tools and community to succeed.
              </p>
            </div>
          </blockquote>
        </div>
      </section>

      {/* ── Why PSPV ─────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4"
        aria-labelledby="comparison-heading"
      >
        <div className="container mx-auto max-w-5xl">
          <h2
            id="comparison-heading"
            className="text-2xl md:text-3xl font-headline font-bold text-white text-center mb-4 uppercase tracking-wide"
          >
            Why PSPV
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-xl mx-auto">
            Existing organizations serve researchers, regulators, and industry
            generalists. None were built for the practitioner.
          </p>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table
              className="w-full text-sm border-collapse"
              aria-label="Comparison of professional societies"
            >
              <thead>
                <tr className="border-b border-white/[0.12]">
                  <th scope="col" className="text-left py-3 px-4 text-slate-400 font-medium w-28">
                    Society
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-slate-400 font-medium">
                    Focus
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-slate-400 font-medium">
                    Audience
                  </th>
                  <th scope="col" className="text-left py-3 px-4 text-slate-400 font-medium w-32">
                    Pricing
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.org}
                    className={
                      row.highlight
                        ? 'border-b border-cyan/30 bg-cyan/5'
                        : 'border-b border-white/[0.06]'
                    }
                  >
                    <td className="py-4 px-4 font-semibold">
                      <span className={row.highlight ? 'text-cyan' : 'text-white'}>
                        {row.org}
                      </span>
                      {row.highlight && (
                        <Badge className="ml-2 bg-cyan/20 text-cyan border-cyan/30 text-xs py-0">
                          This is us
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300">{row.focus}</td>
                    <td className="py-4 px-4 text-slate-300">{row.note}</td>
                    <td className="py-4 px-4 text-slate-300">{row.pricing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {COMPARISON_ROWS.map((row) => (
              <div
                key={row.org}
                className={`rounded-xl border p-5 ${
                  row.highlight
                    ? 'border-cyan/40 bg-cyan/5'
                    : 'border-white/[0.10] bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`font-semibold text-base ${row.highlight ? 'text-cyan' : 'text-white'}`}
                  >
                    {row.org}
                  </span>
                  {row.highlight && (
                    <Badge className="bg-cyan/20 text-cyan border-cyan/30 text-xs py-0">
                      This is us
                    </Badge>
                  )}
                </div>
                <p className="text-slate-300 text-sm mb-1">
                  <span className="text-slate-400">Focus: </span>
                  {row.focus}
                </p>
                <p className="text-slate-300 text-sm mb-1">
                  <span className="text-slate-400">Note: </span>
                  {row.note}
                </p>
                <p className="text-slate-300 text-sm">
                  <span className="text-slate-400">Pricing: </span>
                  {row.pricing}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Membership Tiers ─────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 bg-white/[0.03] border-y border-white/[0.08]"
        aria-labelledby="membership-heading"
      >
        <div className="container mx-auto max-w-6xl">
          <h2
            id="membership-heading"
            className="text-2xl md:text-3xl font-headline font-bold text-white text-center mb-4 uppercase tracking-wide"
          >
            Membership Tiers
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-xl mx-auto">
            One tier for every stage of a PV career. Free for students, always.
          </p>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
            role="list"
            aria-label="Membership tiers"
          >
            {MEMBERSHIP_TIERS.map((tier) => (
              <Card
                key={tier.name}
                role="listitem"
                className={`flex flex-col relative ${
                  tier.highlight
                    ? 'border-cyan/50 bg-cyan/5 ring-1 ring-cyan/30'
                    : 'border-white/[0.10] bg-white/[0.04]'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-cyan text-nex-deep font-semibold text-xs px-3 py-0.5 shadow-lg">
                      {tier.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3 pt-7">
                  <CardTitle
                    className={`text-lg font-bold ${
                      tier.highlight ? 'text-cyan' : 'text-white'
                    }`}
                  >
                    {tier.name}
                  </CardTitle>
                  <div className="mt-1">
                    <span
                      className={`text-3xl font-headline font-bold ${
                        tier.highlight ? 'text-cyan' : 'text-white'
                      }`}
                    >
                      {tier.price}
                    </span>
                    <span className="text-slate-400 text-sm ml-1">
                      {tier.period}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {tier.eligibility}
                  </p>
                  <ul className="space-y-2" aria-label={`${tier.name} benefits`}>
                    {tier.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <span
                          className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                            tier.highlight ? 'bg-cyan' : 'bg-slate-500'
                          }`}
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founding Members ─────────────────────────────────────────────── */}
      <section
        className="py-20 px-4"
        aria-labelledby="founding-heading"
        id="founding"
      >
        <div className="container mx-auto max-w-2xl text-center">
          <h2
            id="founding-heading"
            className="text-2xl md:text-3xl font-headline font-bold text-white mb-4 uppercase tracking-wide"
          >
            Become a Founding Member
          </h2>
          <p className="text-slate-300 text-base leading-relaxed mb-10">
            PSPV is incorporating now. Founding members shape the bylaws, elect
            the first board, and build the community from day one. Your name
            goes on the charter.
          </p>
          <FoundingSignup />
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-white/[0.08] py-10 px-4 bg-white/[0.02]"
        role="contentinfo"
      >
        <div className="container mx-auto max-w-4xl flex flex-col items-center gap-4 text-center text-sm text-slate-400">
          <p className="font-semibold text-slate-300">
            Professional Society of Pharmacovigilance, Inc.
          </p>
          <p>
            &copy; 2026 Professional Society of Pharmacovigilance, Inc. A
            501(c)(6) professional society. Delaware incorporation pending.
          </p>
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-2"
            aria-label="Footer navigation"
          >
            <a
              href="https://algovigilance.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan transition-colors"
            >
              AlgoVigilance.com
            </a>
            <a
              href="mailto:matthew@nexvigilant.com"
              className="hover:text-cyan transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
