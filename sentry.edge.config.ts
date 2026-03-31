import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  initialScope: {
    tags: {
      platform: "nucleus",
      surface: "edge",
    },
  },
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
});
