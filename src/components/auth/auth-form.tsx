"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { trackEvent, identifyUser } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { translateAuthError, getFirebaseErrorCode } from "@/lib/auth-errors";
import { logger } from "@/lib/logger";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { createUserProfile } from "@/lib/actions/users";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface AuthFormProps {
  mode: "signin" | "signup";
  googleOnly?: boolean;
}

export function AuthForm({ mode, googleOnly = false }: AuthFormProps) {
  useAuth(); // Verify auth context is available
  const { track } = useAnalytics();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Track when the signup form renders
  useEffect(() => {
    if (mode === "signup") {
      trackEvent("signup_started", { route: "/auth/signup" });
    }
  }, [mode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Block email/password if googleOnly mode
    if (googleOnly) {
      setError(
        "Email/password authentication is disabled. Please use Google sign-in.",
      );
      return;
    }

    // Prevent duplicate submissions
    if (loading) {
      logger.debug(
        "auth",
        "Form submission already in progress, ignoring duplicate submission",
      );
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      if (mode === "signup") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password,
        );
        await sendEmailVerification(userCredential.user);

        // Create Firestore profile
        const profileResult = await createUserProfile(userCredential.user.uid, {
          email: values.email,
          role: "member",
        });

        if (!profileResult.success) {
          logger.error("auth", "Failed to create user profile", {
            error: profileResult.error,
          });
          // Still show success message since Auth account was created
          // User can still sign in, profile will be created on next login if needed
        }

        // Track signup event
        track("user_signed_up", {
          method: "email",
        });
        trackEvent("signup_completed", {
          method: "email",
        });
        identifyUser(userCredential.user.uid, {
          email: values.email,
          createdAt: new Date().toISOString(),
        });

        setSuccess(
          "Account created! Please check your email to verify your account.",
        );
      } else {
        await signInWithEmailAndPassword(auth, values.email, values.password);

        // Track signin event
        track("user_signed_in", {
          method: "email",
        });
        trackEvent("signin_completed", {
          method: "email",
        });
      }
    } catch (error: unknown) {
      setError(translateAuthError(getFirebaseErrorCode(error)));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      // Create Firestore profile for Google users with basic info
      // They'll complete professional profile via onboarding page
      const profileResult = await createUserProfile(result.user.uid, {
        email: result.user.email ?? "",
        role: "member",
        name: result.user.displayName || undefined,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        avatar: result.user.photoURL || undefined,
        authProviders: ["google"],
        onboardingComplete: false, // Will complete professional profile via onboarding
      });

      if (!profileResult.success) {
        logger.error("auth", "Failed to create user profile", {
          error: profileResult.error,
        });
      }

      // Track Google signin event
      track("user_signed_in", {
        method: "google",
      });
      trackEvent("signin_completed", {
        method: "google",
      });
      identifyUser(result.user.uid, {
        email: result.user.email ?? "",
        name: result.user.displayName || undefined,
      });
    } catch (error: unknown) {
      const errorCode = getFirebaseErrorCode(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Always log full error details for debugging
      logger.error("auth", "Google sign-in failed", {
        errorCode,
        errorMessage,
        fullError: error,
      });

      // In development, show the actual error code for debugging
      if (process.env.NODE_ENV === "development") {
        const translatedMessage = translateAuthError(errorCode);
        setError(
          `${translatedMessage} [Debug: ${errorCode}${errorMessage ? ` - ${errorMessage}` : ""}]`,
        );
      } else {
        setError(translateAuthError(errorCode));
      }
    } finally {
      setLoading(false);
    }
  }

  // Google-only mode: simplified UI
  if (googleOnly) {
    return (
      <Card className="mx-auto max-w-sm bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-gold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Authorized Access Only
          </CardTitle>
          <CardDescription className="text-slate-dim">
            Sign in with your authorized Google account to access the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Google logo"
            >
              <title>Google logo</title>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? "Authenticating..." : "Sign in with Google"}
          </Button>

          {error && (
            <Alert
              variant="destructive"
              role="alert"
              aria-live="assertive"
              className="mt-4"
            >
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert
              className="border-cyan bg-cyan/10 text-cyan mt-4"
              role="alert"
              aria-live="polite"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Access info */}
          <div className="mt-6 p-3 bg-nex-dark/50 rounded-lg border border-slate-dim/20">
            <p className="text-xs text-slate-dim text-center">
              Access is restricted to authorized personnel only.
              <br />
              Contact admin if you need access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Standard mode with email/password + Google
  return (
    <Card className="mx-auto max-w-sm bg-nex-surface border border-nex-light">
      <CardHeader>
        <CardTitle className="text-gold">
          {mode === "signin" ? "Secure Access" : "Register Credentials"}
        </CardTitle>
        <CardDescription className="text-slate-dim">
          {mode === "signin"
            ? "Identity authentication required for system entry."
            : "Establish your credentials for network access."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Google Sign-In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full mb-4 border-nex-light text-slate-dim hover:text-slate-light hover:border-gold/50"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Google logo"
          >
            <title>Google logo</title>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-nex-light" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-nex-surface px-2 text-slate-dim">
              Or continue with
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    {mode === "signin" && (
                      <Link
                        href="/auth/reset-password"
                        className="text-sm text-cyan hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      placeholder="********"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert
                className="border-cyan bg-cyan/10 text-cyan"
                role="alert"
                aria-live="polite"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full border-cyan text-cyan hover:shadow-glow-cyan hover:bg-cyan/10 bg-transparent"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : mode === "signin"
                  ? "Authenticate"
                  : "Register"}
            </Button>
          </form>
        </Form>

        {/* Sign up / Sign in link */}
        <div className="mt-4 text-center text-sm">
          {mode === "signin" ? (
            <>
              No credentials?{" "}
              <Link href="/auth/signup" className="text-cyan hover:underline">
                Request Access Clearance
              </Link>
            </>
          ) : (
            <>
              Already authorized?{" "}
              <Link href="/auth/signin" className="text-cyan hover:underline">
                Authenticate
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
