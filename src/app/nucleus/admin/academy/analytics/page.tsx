'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Award, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getDashboardStats } from '../actions';
import type { DashboardStats } from '@/types/academy';
import { Progress } from '@/components/ui/progress';

import { logger } from '@/lib/logger';
const log = logger.scope('analytics/page');

// Brand-compliant color palette for data visualization
const COLORS = [
  'hsl(189 100% 50%)',    // cyan - Primary brand
  'hsl(42 89% 60%)',      // nex-gold-500 - Secondary brand
  'hsl(210 53% 23%)',     // nex-light - Foundation
  'hsl(189 100% 70%)',    // cyan-soft - Lighter variant
  'hsl(42 89% 76%)',      // nex-gold-300 - Lighter variant
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      log.error('Error loading stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const courseStatusData = [
    { name: 'Published', value: stats.publishedCourses, color: COLORS[0] },
    { name: 'Draft', value: stats.draftCourses, color: COLORS[1] },
    { name: 'Archived', value: stats.archivedCourses, color: COLORS[2] },
  ];

  const practitionerActivityData = [
    { name: 'Total Practitioners', value: stats.totalStudents, color: COLORS[0] },
    { name: 'Active (30d)', value: stats.activeStudents, color: COLORS[3] },
  ];

  // Mock trend data (replace with real data from time-series analytics)
  const enrollmentTrendData = [
    { date: '6 days ago', enrollments: 12, completions: 5 },
    { date: '5 days ago', enrollments: 18, completions: 7 },
    { date: '4 days ago', enrollments: 15, completions: 6 },
    { date: '3 days ago', enrollments: 22, completions: 9 },
    { date: '2 days ago', enrollments: 19, completions: 8 },
    { date: 'Yesterday', enrollments: 25, completions: 11 },
    { date: 'Today', enrollments: stats.enrollmentsLast7Days, completions: stats.completionsLast7Days },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Learning Analytics</h1>
          <p className="text-slate-dim">
            Comprehensive insights into pathway performance and practitioner engagement
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.averageCompletionRate ?? 0).toFixed(1)}%</div>
            <p className="text-xs text-slate-dim mt-1">
              {stats.completionsLast7Days} completions this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Active Learners</CardTitle>
            <Users className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
            <p className="text-xs text-slate-dim mt-1">
              {stats.totalStudents > 0 ? ((stats.activeStudents / stats.totalStudents) * 100).toFixed(0) : 0}% of total practitioners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">New Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrollmentsLast7Days}</div>
            <p className="text-xs text-slate-dim mt-1">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
            <p className="text-xs text-slate-dim mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="courses">Course Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Enrollment & Completion Trend</CardTitle>
                <CardDescription className="text-slate-dim">Daily enrollments vs completions (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke="#06b6d4" strokeWidth={2} />
                    <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Course Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Course Status Distribution</CardTitle>
                <CardDescription className="text-slate-dim">Breakdown of {stats.totalCourses} courses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={courseStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {courseStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Top Performing Courses</CardTitle>
              <CardDescription className="text-slate-dim">Courses ranked by enrollment count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={[...(stats.topCourses || [])]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseId" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Practitioner Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Practitioner Activity</CardTitle>
                <CardDescription className="text-slate-dim">Active vs total practitioners</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={practitionerActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-light">Engagement Metrics</CardTitle>
                <CardDescription className="text-slate-dim">Key engagement indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-slate-dim">{(stats.averageCompletionRate ?? 0).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={stats.averageCompletionRate ?? 0} 
                    className="h-2" 
                    indicatorClassName="bg-green-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Practitioner Rate</span>
                    <span className="text-sm text-slate-dim">
                      {stats.totalStudents > 0 ? ((stats.activeStudents / stats.totalStudents) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <Progress 
                    value={stats.totalStudents > 0 ? (stats.activeStudents / stats.totalStudents) * 100 : 0} 
                    className="h-2" 
                    indicatorClassName="bg-cyan-500"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
                      <p className="text-sm text-slate-dim">Total Enrollments</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.certificatesIssued}</p>
                      <p className="text-sm text-slate-dim">Certificates Issued</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Course Performance Comparison</CardTitle>
              <CardDescription className="text-slate-dim">Enrollment counts across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={[...(stats.topCourses || [])]} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="courseId" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
