'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ADMIN_ACADEMY_ROUTES } from '@/lib/routes';

interface EditPageHeaderProps {
  courseTitle: string;
  courseId: string;
  saving: boolean;
  error: string | null;
  onSave: () => void;
}

export function EditPageHeader({ courseTitle, courseId, saving, error, onSave }: EditPageHeaderProps) {
  return (
    <div className="mb-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`${ADMIN_ACADEMY_ROUTES.ROOT}/courses`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Edit Course</h1>
          <p className="text-slate-dim">{courseTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={ADMIN_ACADEMY_ROUTES.coursePreview(courseId)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          <Button onClick={onSave} disabled={saving} className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
