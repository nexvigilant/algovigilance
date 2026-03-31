import { type Metadata } from 'next';
import Link from 'next/link';
// notFound removed - using custom "Capability Not Found" UI instead
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle2, XCircle, Award, Calendar, User, BookOpen, SearchX, ArrowLeft, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Certificate, Course } from '@/types/academy';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('[verificationId]/page');

function maskDisplayValue(value: string): string {
  if (!value) return 'Unknown User';

  // Email masking
  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    if (local.length <= 2) return `*@${domain}`;
    return `${local[0]}***@${domain}`;
  }

  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    const name = parts[0];
    if (name.length <= 2) return `${name[0]}*`;
    return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name[name.length - 1]}`;
  }

  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first[0]}*. ${last[0]}*.`;
}

interface VerifyCapabilityPageProps {
  params: Promise<{
    verificationId: string;
  }>;
}

export async function generateMetadata({ params }: VerifyCapabilityPageProps): Promise<Metadata> {
  const { verificationId } = await params;
  return {
    title: `Verify Capability ${verificationId} | AlgoVigilance Academy`,
    description: 'Verify the authenticity of a AlgoVigilance Academy capability',
  };
}

async function getCapabilityByNumber(capabilityNumber: string) {
  try {
    // Query certificates collection (data structure unchanged)
    const certificatesQuery = query(
      collection(db, 'certificates'),
      where('certificateNumber', '==', capabilityNumber)
    );

    const snapshot = await getDocs(certificatesQuery);

    if (snapshot.empty) {
      return null;
    }

    const certificateDoc = snapshot.docs[0];
    const certificateData = {
      id: certificateDoc.id,
      ...certificateDoc.data()
    } as Certificate;

    // Fetch course details
    const courseQuery = query(
      collection(db, 'courses'),
      where('id', '==', certificateData.courseId)
    );
    const courseSnapshot = await getDocs(courseQuery);

    let courseName = 'Unknown Pathway';
    if (!courseSnapshot.empty) {
      const courseData = courseSnapshot.docs[0].data() as Course;
      courseName = courseData.title;
    }

    // Fetch user details (display name only for privacy)
    const usersQuery = query(
      collection(db, 'users'),
      where('__name__', '==', certificateData.userId)
    );
    const usersSnapshot = await getDocs(usersQuery);

    let userName = 'Unknown User';
    if (!usersSnapshot.empty) {
      const userData = usersSnapshot.docs[0].data();
      userName = userData.displayName || userData.email || 'Unknown User';
    }

    return {
      capability: certificateData,
      courseName,
      userName: userName || 'Unknown User',
    };
  } catch (error) {
    log.error('Error fetching capability:', error);
    return null;
  }
}

export default async function VerifyCapabilityPage({ params }: VerifyCapabilityPageProps) {
  const { verificationId: capabilityNumber } = await params;

  const data = await getCapabilityByNumber(capabilityNumber);

  // Custom "Capability Not Found" UI instead of generic 404
  if (!data) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6 max-w-2xl">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <Award className="h-16 w-16 text-muted-foreground/50" aria-hidden="true" />
            <SearchX className="h-8 w-8 text-destructive absolute -bottom-1 -right-1 bg-background rounded-full p-1" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold font-headline tracking-tight mb-2">
            Capability Not Found
          </h1>
          <p className="text-muted-foreground">
            We couldn&apos;t find a capability with this number in our records.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Searched Capability Number</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm bg-muted px-3 py-2 rounded block text-center font-mono">
              {capabilityNumber}
            </code>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">What to Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Double-check the capability number</strong> —
              Ensure you&apos;ve entered it exactly as it appears in your capability repository,
              including any dashes or special characters.
            </p>
            <p>
              <strong className="text-foreground">Capability format</strong> —
              AlgoVigilance Academy capabilities typically follow the format: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">NVA-YYYY-XXXXX</code>
            </p>
            <p>
              <strong className="text-foreground">Recently issued?</strong> —
              New capabilities may take a few minutes to appear in our verification system.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link href="/verify">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Try Again
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`mailto:support@nexvigilant.com?subject=Capability%20Verification%20Issue&body=Capability%20Number:%20${capabilityNumber}%0A%0APlease%20describe%20your%20issue:`}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          If you believe this is an error, please contact our support team and we&apos;ll be happy to help.
        </p>
      </div>
    );
  }

  const { capability, courseName, userName } = data;
  const maskedUserName = maskDisplayValue(userName);

  const isValid = !capability.isRevoked;
  const isExpired = capability.expiresAt
    ? new Date(toDateFromSerialized(capability.expiresAt)) < new Date()
    : false;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
      <div className="text-center mb-8">
        <Award className="h-16 w-16 mx-auto text-primary mb-4" aria-hidden="true" />
        <h1 className="text-4xl font-bold font-headline tracking-tight mb-2">
          Capability Verification
        </h1>
        <p className="text-muted-foreground">
          Verify the authenticity of AlgoVigilance Academy capabilities
        </p>
      </div>

      {/* Verification Status */}
      {isValid && !isExpired ? (
        <Alert className="mb-8 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>Valid Capability</strong> - This capability has been verified and is authentic.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="mb-8">
          <XCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>Invalid Capability</strong> -{' '}
            {capability.isRevoked
              ? 'This capability has been revoked.'
              : 'This capability has expired.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Capability Details */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Capability Details</CardTitle>
              <CardDescription>Capability #{capabilityNumber}</CardDescription>
            </div>
            <Badge variant={isValid && !isExpired ? 'default' : 'destructive'}>
              {isValid && !isExpired ? 'Valid' : 'Invalid'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Awarded To</div>
              <div className="text-lg font-semibold">{maskedUserName}</div>
              <p className="text-xs text-muted-foreground mt-1">
                (For privacy, recipient details are partially masked.)
              </p>
            </div>
          </div>

          {/* Pathway */}
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Pathway</div>
              <div className="text-lg font-semibold">{courseName}</div>
            </div>
          </div>

          {/* Issue Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">Issued On</div>
              <div className="text-lg">
                {new Date(toDateFromSerialized(capability.issuedAt)).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Expiration (if applicable) */}
          {capability.expiresAt && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">Expires On</div>
                <div className="text-lg">
                  {new Date(toDateFromSerialized(capability.expiresAt)).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Verification URL */}
          <div className="pt-4 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-2">Verification URL</div>
            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
              {capability.verificationUrl || `https://algovigilance.net/verify/${capabilityNumber}`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>About AlgoVigilance Academy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AlgoVigilance Academy™ provides skills-based training programs and professional
            capability pathways for healthcare professionals. All capabilities issued by the
            Academy can be verified using this portal.
          </p>
          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
            <strong>Need help?</strong> Contact us at{' '}
            <a href="mailto:support@nexvigilant.com" className="text-primary hover:underline">
              support@nexvigilant.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
