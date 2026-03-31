import { createMetadata } from '@/lib/metadata';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle } from 'lucide-react';
import { ModerationDashboard } from './moderation-dashboard';
import { SecurityAuditDashboard } from './security-audit-dashboard';

export const metadata = createMetadata({
  title: 'Content Moderation',
  description: 'Review reported content and manage community safety',
  path: '/nucleus/admin/community/moderation',
});

export default function CommunityModerationPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Report Queue
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <ModerationDashboard />
        </TabsContent>

        <TabsContent value="security">
          <SecurityAuditDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
