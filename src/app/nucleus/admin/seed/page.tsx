'use client';

import { useState } from 'react';
import { doc, setDoc, Timestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { initializeSystemStats } from '@/lib/actions/system-stats';

// Import sample courses
import sampleCoursesData from '@/data/sample-courses.json';
import { allSeedData, getRegistryStats } from '@/data/pathway-registry';

interface SampleCourseData {
  id?: string;
  title: string;
  description?: string;
  topic: string;
  status: string;
  visibility?: string;
  modules: unknown[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface SampleCourse {
  documentId: string;
  data: SampleCourseData;
}

export default function SeedCoursesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [existingCourses, setExistingCourses] = useState<string[]>([]);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // System stats state
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsResult, setStatsResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleInitializeStats = async () => {
    setStatsLoading(true);
    setStatsResult(null);

    try {
      const result = await initializeSystemStats();

      if (result.success) {
        setStatsResult({
          type: 'success',
          message: 'System stats initialized successfully! Dashboard stats (community_members, academy_courses, guardian_threats, careers_roles) are now ready.'
        });
      } else {
        setStatsResult({
          type: 'error',
          message: `Failed to initialize system stats: ${result.error}`
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatsResult({
        type: 'error',
        message: `Error: ${message}`
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const checkExistingCourses = async () => {
    setCheckingExisting(true);
    addLog('Checking existing courses in Firestore...');

    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const courseIds = coursesSnapshot.docs.map(doc => doc.id);
      setExistingCourses(courseIds);

      if (courseIds.length === 0) {
        addLog('No existing courses found.');
        setResult({
          type: 'info',
          message: 'No courses found in database. Ready to seed sample courses.'
        });
      } else {
        addLog(`Found ${courseIds.length} existing courses: ${courseIds.join(', ')}`);
        setResult({
          type: 'info',
          message: `Found ${courseIds.length} existing courses. Seeding will overwrite them.`
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      addLog(`Error checking existing courses: ${message}`);
      setResult({
        type: 'error',
        message: `Failed to check existing courses: ${message}`
      });
    } finally {
      setCheckingExisting(false);
    }
  };

  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [pathwayResult, setPathwayResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const registryStats = getRegistryStats();

  const handleSeedPathways = async () => {
    setPathwayLoading(true);
    setPathwayResult(null);
    setLogs([]);

    addLog(`Starting academy pathway seeding — ${allSeedData.length} pathways...`);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const seedEntry of allSeedData) {
        try {
          addLog(`Processing: ${seedEntry.data.title} (${seedEntry.documentId})`);

          const now = Timestamp.now();
          const data: Record<string, unknown> = { ...seedEntry.data };

          // Replace {{TIMESTAMP}} placeholders with Firestore Timestamps
          if (data.publishedAt === '{{TIMESTAMP}}') {
            data.publishedAt = now;
          }
          if (data.createdAt === '{{TIMESTAMP}}') {
            data.createdAt = now;
          }
          if (data.updatedAt === '{{TIMESTAMP}}') {
            data.updatedAt = now;
          }

          await setDoc(doc(db, 'courses', seedEntry.documentId), data);

          addLog(`✓ Seeded: ${seedEntry.data.title}`);
          successCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          addLog(`✗ Failed: ${seedEntry.documentId}: ${message}`);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        addLog(`\n✅ All ${successCount} pathways seeded!`);
        setPathwayResult({
          type: 'success',
          message: `Successfully seeded ${successCount} academy pathways to Firestore!`
        });
      } else {
        setPathwayResult({
          type: 'error',
          message: `Seeded ${successCount}, failed ${errorCount}. Check logs.`
        });
      }

      await checkExistingCourses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog(`\n❌ Fatal: ${message}`);
      setPathwayResult({ type: 'error', message });
    } finally {
      setPathwayLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    setLogs([]);

    addLog('Starting course seeding process...');
    addLog(`Sample courses to seed: ${sampleCoursesData.length}`);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const courseDoc of sampleCoursesData as SampleCourse[]) {
        try {
          addLog(`Processing: ${courseDoc.data.title} (${courseDoc.documentId})`);

          const data: SampleCourseData = { ...courseDoc.data };

          // Replace {{TIMESTAMP}} placeholders with actual timestamps
          if (data.publishedAt === '{{TIMESTAMP}}') {
            data.publishedAt = Timestamp.now() as unknown as string;
          }
          if (data.createdAt === '{{TIMESTAMP}}') {
            data.createdAt = Timestamp.now() as unknown as string;
          }
          if (data.updatedAt === '{{TIMESTAMP}}') {
            data.updatedAt = Timestamp.now() as unknown as string;
          }

          // Validate required fields
          const requiredFields = ['id', 'title', 'description', 'topic', 'modules', 'status', 'visibility'];
          const missingFields = requiredFields.filter(field => !data[field]);

          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }

          // Write to Firestore
          await setDoc(doc(db, 'courses', courseDoc.documentId), data);

          addLog(`✓ Successfully seeded: ${data.title}`);
          successCount++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error occurred';
          addLog(`✗ Failed to seed ${courseDoc.documentId}: ${message}`);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        addLog(`\n✅ All ${successCount} courses seeded successfully!`);
        setResult({
          type: 'success',
          message: `Successfully seeded ${successCount} courses to Firestore!`
        });
      } else {
        addLog(`\n⚠️ Completed with ${successCount} successes and ${errorCount} failures.`);
        setResult({
          type: 'error',
          message: `Seeded ${successCount} courses, but ${errorCount} failed. Check logs for details.`
        });
      }

      // Refresh existing courses list
      await checkExistingCourses();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      addLog(`\n❌ Fatal error: ${message}`);
      setResult({
        type: 'error',
        message: `Fatal error during seeding: ${message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline mb-2">Database Seeder</h1>
        <p className="text-muted-foreground">
          Initialize system statistics and import sample courses into Firestore for testing.
        </p>
      </div>

      {/* System Stats Initialization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Statistics</CardTitle>
          <CardDescription>
            Initialize dashboard KPIs (community_members, academy_courses, guardian_threats, careers_roles)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This fixes "permission-denied" errors during build by creating the system_stats collection with default values.
          </p>

          <Button
            onClick={handleInitializeStats}
            disabled={statsLoading}
            variant="outline"
          >
            {statsLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize System Stats'
            )}
          </Button>

          {statsResult && (
            <Alert variant={statsResult.type === 'error' ? 'destructive' : 'default'}>
              {statsResult.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {statsResult.type === 'error' && <XCircle className="h-4 w-4" />}
              <AlertTitle>
                {statsResult.type === 'success' && 'Success!'}
                {statsResult.type === 'error' && 'Error'}
              </AlertTitle>
              <AlertDescription>{statsResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Academy Pathways (forge-compiled) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Academy Pathways</CardTitle>
          <CardDescription>
            {registryStats.pathwayCount} pathways ({registryStats.totalStages} stages, {registryStats.totalActivities} activities) compiled by academy-forge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {registryStats.pathways.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg text-sm">
                <code className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">{p.id}</code>
                <span className="flex-1 font-medium">{p.title}</span>
                <span className="text-muted-foreground">{p.stages} stages</span>
                <span className="text-muted-foreground">{p.activities} activities</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <Button
              onClick={handleSeedPathways}
              disabled={pathwayLoading || loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {pathwayLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Pathways...
                </>
              ) : (
                `Seed ${registryStats.pathwayCount} Academy Pathways`
              )}
            </Button>
          </div>

          {pathwayResult && (
            <Alert variant={pathwayResult.type === 'error' ? 'destructive' : 'default'}>
              {pathwayResult.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {pathwayResult.type === 'error' && <XCircle className="h-4 w-4" />}
              <AlertTitle>
                {pathwayResult.type === 'success' ? 'Success!' : 'Error'}
              </AlertTitle>
              <AlertDescription>{pathwayResult.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Sample Courses Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sample Courses Available</CardTitle>
          <CardDescription>
            {sampleCoursesData.length} sample courses ready to import from{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">src/data/sample-courses.json</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(sampleCoursesData as SampleCourse[]).map((course, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold">{course.data.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ID: <code className="text-xs">{course.documentId}</code>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Topic: {course.data.topic} • {course.data.modules.length} module(s) • {course.data.status}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Check existing data or seed sample courses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={checkExistingCourses}
              disabled={checkingExisting || loading}
              variant="outline"
            >
              {checkingExisting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Existing Courses'
              )}
            </Button>

            <Button
              onClick={handleSeed}
              disabled={loading || checkingExisting}
              className="bg-cyan hover:bg-cyan-dark/80"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                'Seed Sample Courses'
              )}
            </Button>
          </div>

          {existingCourses.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Existing Courses</AlertTitle>
              <AlertDescription>
                Found {existingCourses.length} course(s) in database: {existingCourses.join(', ')}.
                Seeding will overwrite existing data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Result Alert */}
      {result && (
        <Alert className="mb-6" variant={result.type === 'error' ? 'destructive' : 'default'}>
          {result.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {result.type === 'error' && <XCircle className="h-4 w-4" />}
          {result.type === 'info' && <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {result.type === 'success' && 'Success!'}
            {result.type === 'error' && 'Error'}
            {result.type === 'info' && 'Information'}
          </AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seeding Logs</CardTitle>
            <CardDescription>Detailed operation log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Next Steps After Seeding</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Visit{' '}
              <a href="/nucleus/academy" className="text-cyan hover:underline">
                Academy Catalog
              </a>{' '}
              to view courses
            </li>
            <li>Enroll in a course to test enrollment system</li>
            <li>Complete video lessons and quizzes</li>
            <li>Test certificate generation on course completion</li>
            <li>
              Share Firestore structure with course builder developer (see{' '}
              <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
                Firebase Console
              </a>
              )
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
