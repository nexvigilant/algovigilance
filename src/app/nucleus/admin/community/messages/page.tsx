'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Activity,
  TrendingUp,
  Search,
  Eye,
  BarChart3,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { customToast } from '@/components/voice';
import {
  getMessagingAnalytics,
  getAllConversationsAdmin,
  getConversationMessagesAdmin,
  searchMessagesAdmin,
  type MessagingAnalytics,
  type ConversationDetail,
} from './actions';

export default function MessagesAdminPage() {
  const [analytics, setAnalytics] = useState<MessagingAnalytics | null>(null);
  const [conversations, setConversations] = useState<ConversationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchMessagesAdmin>>>([]);
  const [searching, setSearching] = useState(false);
  const [_selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Awaited<ReturnType<typeof getConversationMessagesAdmin>>>([]);
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [analyticsData, conversationsData] = await Promise.all([
        getMessagingAnalytics(),
        getAllConversationsAdmin(),
      ]);
      setAnalytics(analyticsData);
      setConversations(conversationsData);
    } catch (error) {
      customToast.error('Failed to load messaging data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (searchTerm.length < 3) {
      customToast.error('Search term must be at least 3 characters');
      return;
    }

    setSearching(true);
    try {
      const results = await searchMessagesAdmin(searchTerm);
      setSearchResults(results);
      if (results.length === 0) {
        customToast.info('No messages found');
      }
    } catch (error) {
      customToast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function viewConversationMessages(conversationId: string) {
    setSelectedConversation(conversationId);
    try {
      const messages = await getConversationMessagesAdmin(conversationId);
      setConversationMessages(messages);
      setMessagesDialogOpen(true);
    } catch (error) {
      customToast.error('Failed to load messages');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex h-64 items-center justify-center">
          <div className="text-slate-dim">Loading messaging data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
          Messages Management
        </h1>
        <p className="text-slate-dim">
          Monitor conversations, view analytics, and search message content.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalConversations || 0}
            </div>
            <p className="text-xs text-slate-dim">
              {analytics?.totalMessages || 0} total messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.activeConversationsToday || 0}
            </div>
            <p className="text-xs text-slate-dim">
              {analytics?.activeConversationsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Avg Messages</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageMessagesPerConversation || 0}
            </div>
            <p className="text-xs text-slate-dim">per conversation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Top Messagers</CardTitle>
            <Users className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.topMessagers[0]?.messageCount || 0}
            </div>
            <p className="text-xs text-slate-dim">
              {analytics?.topMessagers[0]?.userName || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">
            <MessageSquare className="mr-2 h-4 w-4" />
            Conversations
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="mr-2 h-4 w-4" />
            Search Messages
          </TabsTrigger>
          <TabsTrigger value="activity">
            <BarChart3 className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Recent Conversations</CardTitle>
              <CardDescription className="text-slate-dim">
                All conversations sorted by last activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversations.length > 0 ? (
                <Table aria-label="Recent conversations">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participants</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Message</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversations.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {conv.participants.map((p, i) => (
                              <span key={i} className="text-sm">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{conv.messageCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-sm text-slate-dim">
                            {conv.lastMessage?.content || 'No messages'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {conv.updatedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewConversationMessages(conv.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-slate-dim">
                  No conversations found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Search Messages</CardTitle>
              <CardDescription className="text-slate-dim">
                Search across all conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="Search message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 ? (
                <Table aria-label="Message search results">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sender</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result) => (
                      <TableRow key={result.messageId}>
                        <TableCell>{result.senderName}</TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            {result.content.length > 100
                              ? `${result.content.substring(0, 100)}...`
                              : result.content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-dim">
                            {result.participants.join(', ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {result.createdAt.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-slate-dim">
                  {searchTerm ? 'No results found' : 'Enter a search term'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Top Messagers</CardTitle>
                <CardDescription className="text-slate-dim">Most active users by message count</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.topMessagers && analytics.topMessagers.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topMessagers.map((user, index) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{user.userName}</span>
                        </div>
                        <Badge variant="outline">
                          {user.messageCount} messages
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-dim">
                    No activity data
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Message Volume (Last 7 Days)</CardTitle>
                <CardDescription className="text-slate-dim">Daily message counts</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.messageVolumeByDay && analytics.messageVolumeByDay.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.messageVolumeByDay.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-dim">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${Math.min((day.count / Math.max(...analytics.messageVolumeByDay.map(d => d.count), 1)) * 100, 100)}px`,
                            }}
                          />
                          <span className="text-sm font-medium">{day.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-dim">
                    No volume data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Messages Dialog */}
      <Dialog open={messagesDialogOpen} onOpenChange={setMessagesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conversation Messages</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-4">
              {conversationMessages.map((msg) => (
                <div key={msg.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{msg.senderName}</span>
                    <span className="text-xs text-slate-dim">
                      {msg.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              {conversationMessages.length === 0 && (
                <p className="text-center text-slate-dim">
                  No messages in this conversation
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
