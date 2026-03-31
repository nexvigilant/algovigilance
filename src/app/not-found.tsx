import { createMetadata } from '@/lib/metadata';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = createMetadata({
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
  path: '/404',
  noIndex: true,
});

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page not found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/">Go home</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/nucleus">Nucleus</Link>
            </Button>
          </div>
          <div className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
