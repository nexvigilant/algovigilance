import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Station API — Free During Beta",
  description:
    "All 2,000+ AlgoVigilance Station pharmacovigilance tools are free during open beta. No API key required. Credit billing launches post-beta.",
};

export default function StationPricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-16 px-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Station API</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            2,000+ pharmacovigilance tools. No API key required during open
            beta.
          </p>
        </div>

        {/* Beta Banner */}
        <div className="mb-10 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
              Open Beta
            </span>
          </div>
          <p className="text-base font-medium text-white mb-1">
            All tools are free. No account. No API key. No billing.
          </p>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Point your MCP client at{" "}
            <code className="text-emerald-400">mcp.nexvigilant.com/mcp</code>{" "}
            and call any tool. Credit-based billing launches post-beta — the
            rate card below is our published future model.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href="/station/connect"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              Connect Your AI →
            </Link>
          </div>
        </div>

        {/* Free tier */}
        <div className="border border-green-800 bg-green-950/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-green-800 text-green-100 rounded-full text-sm font-medium">
              Free
            </span>
            <h2 className="text-xl font-semibold">Discovery Tools</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            No API key required. No sign-up. Just call the tools.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "chart_course",
              "directory",
              "capabilities",
              "station_health",
              "ring_health",
            ].map((tool) => (
              <code
                key={tool}
                className="px-2 py-1 bg-green-950/50 border border-green-900 rounded text-xs text-green-400"
              >
                nexvigilant_{tool}
              </code>
            ))}
          </div>
        </div>

        {/* Future pricing — labeled clearly */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 border-t border-border/40" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground px-2">
            Future Pricing Model
          </span>
          <div className="flex-1 border-t border-border/40" />
        </div>

        {/* Credit packs */}
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Credit Packs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              credits: "1,000",
              price: "$10",
              best: false,
              desc: "Try it out",
            },
            {
              credits: "5,000",
              price: "$50",
              best: true,
              desc: "Most popular",
            },
            {
              credits: "10,000",
              price: "$100",
              best: false,
              desc: "Power user",
            },
          ].map((pack) => (
            <div
              key={pack.credits}
              className={`border rounded-xl p-6 text-center ${
                pack.best
                  ? "border-blue-500 bg-blue-950/20 ring-1 ring-blue-500"
                  : "border-border"
              }`}
            >
              {pack.best && (
                <span className="inline-block px-3 py-1 bg-blue-800 text-blue-100 rounded-full text-xs font-medium mb-3">
                  Most Popular
                </span>
              )}
              <p className="text-3xl font-bold mb-1">{pack.price}</p>
              <p className="text-lg text-muted-foreground mb-2">
                {pack.credits} credits
              </p>
              <p className="text-sm text-muted-foreground mb-4">{pack.desc}</p>
              <Link
                href="/auth/signin?redirect=/nucleus/billing/station-keys"
                className="inline-block w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="border rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Sign Up",
                desc: "Create a free account",
              },
              {
                step: "2",
                title: "Get API Key",
                desc: "Generate your key in one click",
              },
              {
                step: "3",
                title: "Buy Credits",
                desc: "Choose a credit pack",
              },
              {
                step: "4",
                title: "Use Tools",
                desc: "Call any of 230+ PV tools",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rate card */}
        <div className="border rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-2">Rate Card</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Standard model rates + 30% AlgoVigilance harness premium. 1 credit ≈
            1,000 tokens through the harness.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3">Model</th>
                <th className="text-right py-3">Input / M tokens</th>
                <th className="text-right py-3">Output / M tokens</th>
                <th className="text-right py-3">With Harness</th>
              </tr>
            </thead>
            <tbody>
              {[
                { model: "Claude Opus 4.6", input: 15.0, output: 75.0 },
                { model: "Claude Sonnet 4.6", input: 3.0, output: 15.0 },
                { model: "Claude Haiku 4.5", input: 0.8, output: 4.0 },
                { model: "Gemini 2.5 Pro", input: 1.25, output: 10.0 },
                { model: "GPT-4o", input: 2.5, output: 10.0 },
              ].map((r) => (
                <tr key={r.model} className="border-b border-border/50">
                  <td className="py-3">{r.model}</td>
                  <td className="text-right">${r.input.toFixed(2)}</td>
                  <td className="text-right">${r.output.toFixed(2)}</td>
                  <td className="text-right text-green-400">1.30x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="border rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "What is a credit?",
                a: "1 credit ≈ 1,000 tokens processed through AlgoVigilance Station. A typical drug safety query uses 2-5 credits.",
              },
              {
                q: "Do credits expire?",
                a: "No. Credits never expire. Use them whenever you need PV intelligence.",
              },
              {
                q: "What tools are free?",
                a: "chart_course, directory, capabilities, station_health, and ring_health are always free. No API key needed.",
              },
              {
                q: "How do I connect my agent?",
                a: "Add your API key as a Bearer token in the Authorization header. Point your MCP client to https://mcp.nexvigilant.com/mcp",
              },
              {
                q: "What is the 30% harness premium?",
                a: "You pay your model provider standard rates. The 30% premium gives your agent access to 230+ PV tools it cannot use otherwise.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-medium mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
