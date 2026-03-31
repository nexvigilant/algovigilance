import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageWrapper } from "@/components/layout";
import { HeroSection } from "@/components/marketing/landing";
import { EcosystemGrid } from "@/components/marketing/landing/ecosystem-grid";
import { PVMissionBar } from "@/components/marketing/landing/pv-mission-bar";
import { LiveFeedSection } from "@/components/god/live-feed-section";
import { ConnectAICTA } from "@/components/marketing/landing/connect-ai-cta";
import { SignUpCTA } from "@/components/marketing/landing/signup-cta";

export const metadata: Metadata = {
  title: "AlgoVigilance | Free Pharmacovigilance Tools — Agents & Humans Welcome",
  description:
    "2,023 free financial analytics tools. Market surveillance, algorithmic monitoring, risk analytics. Open to AI agents and humans. No account required.",
  alternates: {
    canonical: "https://algovigilance.net",
  },
  openGraph: {
    title: "AlgoVigilance | Free PV Tools — Agents & Humans Welcome",
    description:
      "2,023 financial analytics tools. Market surveillance, algorithmic monitoring, risk analytics. Free and open. AI agents and humans welcomed.",
    url: "https://algovigilance.net",
    siteName: "AlgoVigilance",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AlgoVigilance — Free Pharmacovigilance Tools for Agents & Humans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AlgoVigilance | Free PV Tools — Agents & Humans Welcome",
    description:
      "2,023 financial analytics tools. Free. Open. AI agents and humans welcomed.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <PublicPageWrapper networkOpacity={0.85} theme="guardian">
      {/* ════════════════════════════════════════════════════════════════
          OPEN WHILE UNDER CONSTRUCTION — THE BIG BANNER
          ════════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 mx-auto max-w-5xl px-6 pt-8 pb-4">
        <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-zinc-900/95 to-cyan-950/60 p-8 text-center backdrop-blur-sm sm:p-12">
          {/* Construction Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-900/30 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-mono tracking-wider text-amber-300">
              OPEN WHILE UNDER CONSTRUCTION
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Agents &amp; Humans Welcome
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            2,023 financial analytics tools. Free. Open. No payments required.
            <br />
            <span className="text-emerald-400">
              Patient safety knowledge belongs to everyone.
            </span>
          </p>

          {/* Stats Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <span className="rounded-md bg-zinc-800/80 px-3 py-1 text-zinc-300">
              <span className="font-bold text-white">2,023</span> MCP Tools
            </span>
            <span className="rounded-md bg-zinc-800/80 px-3 py-1 text-zinc-300">
              <span className="font-bold text-white">7</span> Live Dashboards
            </span>
            <span className="rounded-md bg-zinc-800/80 px-3 py-1 text-zinc-300">
              <span className="font-bold text-white">11</span> Regulatory Agencies
            </span>
            <span className="rounded-md bg-zinc-800/80 px-3 py-1 text-zinc-300">
              <span className="font-bold text-white">280</span> Open Source Crates
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <SignUpCTA />
            <ConnectAICTA />
            <Link
              href="/dashboards"
              className="rounded-xl border-2 border-zinc-600 px-8 py-3.5 text-lg font-medium text-zinc-200 transition-all hover:border-zinc-400 hover:text-white"
            >
              Try the Dashboards
            </Link>
          </div>

          {/* No Warranties Notice */}
          <p className="mt-6 text-xs text-zinc-500">
            No warranties. No payments required. All tools provided as-is for
            research and education.
          </p>
        </div>
      </div>

      <HeroSection />

      {/* Live Feed CTA */}
      <div className="relative z-10 -mt-16 mb-4">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            href="/station/demo"
            className="group block rounded-xl border border-red-800/40 bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-red-950/20 p-5 backdrop-blur-sm transition-all hover:border-red-500/60 hover:shadow-lg hover:shadow-red-900/20"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="px-2 py-1 bg-red-900/40 text-red-400 text-[10px] font-mono rounded tracking-wider">
                  LIVE
                </span>
                <span className="px-2 py-1 bg-cyan-900/40 text-cyan-400 text-[10px] font-mono rounded tracking-wider">
                  8 DRUGS · 60 PIPELINES
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors">
                  View Live Signal Feed
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Watch parallel signal detection across FDA FAERS — 20M+
                  reports, real-time
                </p>
              </div>
              <span className="text-zinc-500 group-hover:text-red-400 transition-colors text-sm shrink-0">
                Stream Now &rarr;
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Featured Research Banner */}
      <div className="relative z-10 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            href="/station/semaglutide"
            className="group block rounded-xl border border-cyan-800/40 bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-cyan-950/30 p-6 backdrop-blur-sm transition-all hover:border-cyan-600/60 hover:shadow-lg hover:shadow-cyan-900/20"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <span className="px-2 py-1 bg-cyan-900/40 text-cyan-400 text-[10px] font-mono rounded tracking-wider">
                  WORKED EXAMPLE
                </span>
                <span className="px-2 py-1 bg-emerald-900/40 text-emerald-400 text-[10px] font-mono rounded tracking-wider">
                  SEMAGLUTIDE
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Semaglutide + Pancreatitis Signal Investigation
                </h3>
                <p className="text-sm text-zinc-400 mt-0.5 truncate">
                  Live FDA FAERS data, PRR/ROR/IC/EBGM analysis, DailyMed labeling, PubMed literature
                </p>
              </div>
              <span className="text-zinc-500 group-hover:text-cyan-400 transition-colors text-sm shrink-0">
                Run Investigation &rarr;
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Live GoD Feed — 3D Cell Nucleus */}
      <LiveFeedSection />

      {/* Mission Bar - Three Domains */}
      <PVMissionBar />

      <EcosystemGrid />
    </PublicPageWrapper>
  );
}
