import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance | AlgoVigilance',
  description: 'AlgoVigilance is currently undergoing scheduled maintenance.',
  robots: 'noindex, nofollow',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <svg
            viewBox="0 0 40 40"
            className="w-16 h-16 mx-auto text-cyan-400"
            fill="currentColor"
          >
            <path d="M20 0L0 10v20l20 10 20-10V10L20 0zm0 4l16 8-16 8-16-8 16-8zm-16 12l16 8v12l-16-8V16zm32 0v12l-16 8V24l16-8z" />
          </svg>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">
            Scheduled Maintenance
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          We'll Be Back Soon
        </h1>

        {/* Message */}
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          AlgoVigilance is currently undergoing scheduled maintenance to improve
          your experience. We apologize for any inconvenience.
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mb-8" />

        {/* Contact */}
        <div className="text-slate-500 text-sm">
          <p className="mb-2">Questions or urgent matters?</p>
          <a
            href="mailto:support@nexvigilant.com"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            support@nexvigilant.com
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-slate-600 text-xs">
            &copy; {new Date().getFullYear()} AlgoVigilance. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
