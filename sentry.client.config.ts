import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay: capture 1% normally, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],

  // PV-specific context tags
  initialScope: {
    tags: {
      platform: "nucleus",
      surface: "web",
    },
  },

  // Filter noise
  ignoreErrors: [
    // Browser extension noise
    "ResizeObserver loop",
    "Non-Error promise rejection",
    // Next.js hydration (expected in dev)
    "Hydration failed",
  ],

  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
