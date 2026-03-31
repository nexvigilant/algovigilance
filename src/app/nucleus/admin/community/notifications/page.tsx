'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  History,
  Users,
  Mail,
  Clock,
  Megaphone,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { customToast } from '@/components/voice';
import {
  getNotificationAnalytics,
  sendBroadcastNotification,
  getBroadcastHistory,
  getNotificationTypeStats,
  previewBroadcastRecipients,
  type NotificationAnalytics,
  type BroadcastHistory,
} from './actions';
const BROADCAST_TYPE_VALUES = ['announcement', 'update', 'alert', 'promotion'] as const;
const BROADCAST_AUDIENCE_VALUES = ['all', 'active', 'new', 'premium'] as const;

type BroadcastType = (typeof BROADCAST_TYPE_VALUES)[number];
type BroadcastAudience = (typeof BROADCAST_AUDIENCE_VALUES)[number];

function isBroadcastType(value: string): value is BroadcastType {
  return (BROADCAST_TYPE_VALUES as readonly string[]).includes(value);
}

function isBroadcastAudience(value: string): value is BroadcastAudience {
  return (BROADCAST_AUDIENCE_VALUES as readonly string[]).includes(value);
}

export default function NotificationsAdminPage() {
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [typeStats, setTypeStats] = useState<Array<{
    type: string;
    label: string;
    count: number;
    readRate: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<number>(0);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as BroadcastType,
    targetAudience: 'all' as BroadcastAudience,
    actionUrl: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Preview recipient count when audience changes
    previewBroadcastRecipients(broadcastForm.targetAudience).then((result) => {
      setRecipientPreview(result.count);
    });
  }, [broadcastForm.targetAudience]);

  async function loadData() {
    try {
      setLoading(true);
      const [analyticsData, historyData, statsData] = await Promise.all([
        getNotificationAnalytics(),
        getBroadcastHistory(),
        getNotificationTypeStats(),
      ]);
      setAnalytics(analyticsData);
      setHistory(historyData);
      setTypeStats(statsData);
    } catch (error) {
      customToast.error('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendBroadcast() {
    if (!broadcastForm.title || !broadcastForm.message) {
      customToast.error('Please fill in all required fields');
      return;
    }

    setSendingBroadcast(true);
    try {
      const result = await sendBroadcastNotification(broadcastForm);
      if (result.success) {
        customToast.success(`Broadcast sent to ${result.recipientCount} users`);
        setBroadcastDialogOpen(false);
        setBroadcastForm({
          title: '',
          message: '',
          type: 'announcement',
          targetAudience: 'all',
          actionUrl: '',
        });
        loadData();
      } else {
        customToast.error(result.error || 'Failed to send broadcast');
      }
    } catch (error) {
      customToast.error('Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      announcement: 'bg-blue-500',
      update: 'bg-green-500',
      alert: 'bg-red-500',
      promotion: 'bg-purple-500',
      badge: 'bg-amber-500',
      message: 'bg-cyan-500',
      reply: 'bg-indigo-500',
      reaction: 'bg-pink-500',
      follow: 'bg-teal-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all: 'All Users',
      active: 'Active Users (7 days)',
      new: 'New Users (30 days)',
      premium: 'Premium Users',
    };
    return labels[audience] || audience;
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-slate-dim">Loading notifications data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
            Notification Management
          </h1>
          <p className="text-slate-dim">
            Send broadcasts, view analytics, and manage notification settings.
          </p>
        </div>
        <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Megaphone className="mr-2 h-4 w-4" />
              Send Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Send Broadcast Notification</DialogTitle>
              <DialogDescription>
                Send a notification to multiple users at once.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message"
                  rows={3}
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, message: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={broadcastForm.type}
                    onValueChange={(value) => {
                      if (isBroadcastType(value)) {
                        setBroadcastForm({ ...broadcastForm, type: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={broadcastForm.targetAudience}
                    onValueChange={(value) => {
                      if (isBroadcastAudience(value)) {
                        setBroadcastForm({ ...broadcastForm, targetAudience: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active (7 days)</SelectItem>
                      <SelectItem value="new">New (30 days)</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="actionUrl">Action URL (optional)</Label>
                <Input
                  id="actionUrl"
                  placeholder="/nucleus/community/..."
                  value={broadcastForm.actionUrl}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })
                  }
                />
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>
                    Will be sent to <strong>{recipientPreview}</strong> users
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBroadcastDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSendBroadcast} disabled={sendingBroadcast}>
                {sendingBroadcast ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalNotificationsSent.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-dim">
              Sampled from recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Today</CardTitle>
            <Clock className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.notificationsToday || 0}
            </div>
            <p className="text-xs text-slate-dim">
              {analytics?.notificationsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Read Rate</CardTitle>
            <Eye className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageReadRate || 0}%
            </div>
            <Progress
              value={analytics?.averageReadRate || 0}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Broadcasts</CardTitle>
            <Megaphone className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.recentBroadcasts.length || 0}
            </div>
            <p className="text-xs text-slate-dim">
              Total broadcasts sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">
            <BarChart3 className="mr-2 h-4 w-4" />
            Type Distribution
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Broadcast History
          </TabsTrigger>
        </TabsList>

        {/* Type Distribution Tab */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Notification Types</CardTitle>
              <CardDescription className="text-slate-dim">
                Distribution and read rates by notification type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {typeStats.length > 0 ? (
                <div className="space-y-4">
                  {typeStats.map((stat) => (
                    <div key={stat.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-3 w-3 rounded-full ${getTypeColor(stat.type)}`}
                          />
                          <span className="font-medium">{stat.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-dim">
                            {stat.count.toLocaleString()} sent
                          </span>
                          <Badge variant="outline">{stat.readRate}% read</Badge>
                        </div>
                      </div>
                      <Progress value={stat.readRate} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-dim">
                  No notification data available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcast History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Broadcast History</CardTitle>
              <CardDescription className="text-slate-dim">
                All system-wide notifications sent by admins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <Table aria-label="Broadcast notification history">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Read Rate</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{broadcast.title}</div>
                            <div className="max-w-xs truncate text-xs text-slate-dim">
                              {broadcast.message}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`border-0 text-white ${getTypeColor(broadcast.type)}`}
                          >
                            {broadcast.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getAudienceLabel(broadcast.targetAudience)}
                        </TableCell>
                        <TableCell>{broadcast.recipientCount}</TableCell>
                        <TableCell>
                          {broadcast.recipientCount > 0
                            ? Math.round(
                                (broadcast.readCount / broadcast.recipientCount) * 100
                              )
                            : 0}
                          %
                        </TableCell>
                        <TableCell>{broadcast.adminName}</TableCell>
                        <TableCell>
                          {broadcast.createdAt.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-slate-dim">
                  No broadcasts sent yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
