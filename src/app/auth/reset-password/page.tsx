'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { translateAuthError } from '@/lib/auth-errors';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      await sendPasswordResetEmail(auth, values.email);
      setSuccess('Password reset email sent! Please check your inbox.');
      form.reset();
    } catch (error: unknown) {
      const authError = error as { code?: string };
      setError(translateAuthError(authError.code || 'auth/internal-error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-24 pcb-grid overflow-hidden">
      <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
      <Card className="relative z-10 mx-auto max-w-sm w-full bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-gold">Reset Password</CardTitle>
          <CardDescription className="text-slate-dim">
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="reset-email">Email</FormLabel>
                    <FormControl>
                      <Input id="reset-email" placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-cyan bg-cyan/10 text-cyan">
                  <CheckCircle2 className="h-4 w-4 text-cyan" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-2 text-sm text-slate-dim hover:text-cyan transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
