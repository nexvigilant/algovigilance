import { createMetadata } from '@/lib/metadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Handshake,
  Mail,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = createMetadata({
  title: 'Website Leads',
  description: 'Manage all website lead sources - consulting inquiries, contact submissions, and quiz sessions',
  path: '/nucleus/admin/website-leads',
});

export default function WebsiteLeadsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-6 w-6 text-cyan" />
          <h2 className="text-xl font-bold text-slate-light">
            Website Leads Hub
          </h2>
        </div>
        <p className="text-slate-dim">
          Central dashboard for all website lead sources. Monitor consulting inquiries,
          contact form submissions, and service wizard quiz sessions.
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan/10">
                <Users className="h-5 w-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-light">--</p>
                <p className="text-xs text-slate-dim">Total Leads This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <Handshake className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-light">--</p>
                <p className="text-xs text-slate-dim">High-Value Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald/10">
                <Clock className="h-5 w-5 text-emerald" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-light">--</p>
                <p className="text-xs text-slate-dim">Awaiting Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Sources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Consulting Leads */}
        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 group">
          <CardHeader>
            <Handshake className="h-8 w-8 text-cyan mb-2 group-hover:text-slate-light transition-colors" />
            <CardTitle className="text-slate-light">Consulting Leads</CardTitle>
            <CardDescription className="text-slate-dim">
              Enterprise consulting inquiries with lead scoring and qualification data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/nucleus/admin/website-leads/consulting">
              <Button className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan group-hover:glow-cyan">
                View Leads
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contact Submissions */}
        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 group">
          <CardHeader>
            <Mail className="h-8 w-8 text-cyan mb-2 group-hover:text-slate-light transition-colors" />
            <CardTitle className="text-slate-light">Contact Submissions</CardTitle>
            <CardDescription className="text-slate-dim">
              General contact form messages and inquiries from the website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/nucleus/admin/website-leads/contact">
              <Button className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan group-hover:glow-cyan">
                View Submissions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quiz Sessions */}
        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 group">
          <CardHeader>
            <ClipboardList className="h-8 w-8 text-cyan mb-2 group-hover:text-slate-light transition-colors" />
            <CardTitle className="text-slate-light">Quiz Sessions</CardTitle>
            <CardDescription className="text-slate-dim">
              Service wizard quiz completions with recommendations and contact info
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/nucleus/admin/website-leads/quiz-sessions">
              <Button className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan group-hover:glow-cyan">
                View Sessions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <div className="bg-nex-surface/50 border border-nex-light rounded-lg p-4">
        <p className="text-sm text-slate-dim">
          <span className="text-cyan font-medium">Tip:</span> All lead sources feed into a unified
          pipeline. Use the individual sections to manage specific lead types, or export combined
          reports for CRM integration.
        </p>
      </div>
    </div>
  );
}
