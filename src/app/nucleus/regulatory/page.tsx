import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'
import { BookOpen, FileText, Clock, Search, Scale } from 'lucide-react'
import { RegulatoryDashboard } from './components/regulatory-dashboard'

export const metadata = createMetadata({
  title: 'Regulatory Intelligence',
  description: 'FDA regulatory monitoring dashboard — adverse events, recalls, drug labels, device reports, and guidance documents.',
  path: '/nucleus/regulatory',
})

const REGULATORY_SECTIONS = [
  { href: '/nucleus/regulatory/glossary', label: 'PV Glossary', desc: '78 terms from ICH, FDA, EMA, WHO, CIOMS', icon: BookOpen },
  { href: '/nucleus/regulatory/directory', label: 'Document Directory', desc: '48 regulatory docs across 9 jurisdictions', icon: FileText },
  { href: '/nucleus/regulatory/timelines', label: 'Reporting Timelines', desc: 'Cross-jurisdictional deadline comparison', icon: Clock },
  { href: '/nucleus/regulatory/guidelines', label: 'Guidelines Reference', desc: 'ICH, GVP, CIOMS, FDA searchable guidelines', icon: Search },
] as const

export default function RegulatoryPage() {
  return (
    <>
      {/* Header + reference section navigation */}
      <div className="mx-auto max-w-7xl px-4 pb-2 pt-6">
        <header className="mb-golden-3">
          <div className="mb-golden-2 flex items-center gap-golden-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-violet-400/30 bg-violet-400/5">
              <Scale className="h-5 w-5 text-violet-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-violet-400/60">
                AlgoVigilance Regulatory
              </p>
              <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                Regulatory Intelligence
              </h1>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-golden text-slate-dim/70">
            Live FDA data — adverse events, recalls, drug labels, devices, NDC directory, and guidance
          </p>
        </header>

        <nav
          className="grid grid-cols-2 gap-golden-2 lg:grid-cols-4"
          aria-label="Reference sections"
        >
          {REGULATORY_SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group border border-nex-light bg-nex-surface/50 p-golden-3 transition-all hover:border-cyan/30 hover:bg-cyan/5"
              >
                <div className="mb-golden-1 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-cyan-400 group-hover:text-cyan-300" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-dim/50 group-hover:text-cyan-400">
                    {s.label}
                  </span>
                </div>
                <p className="font-mono text-[11px] leading-golden text-slate-dim/60">{s.desc}</p>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Registry-driven live data dashboard */}
      <RegulatoryDashboard />
    </>
  )
}
