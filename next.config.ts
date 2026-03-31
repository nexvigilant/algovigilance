import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withBotId } from "botid/next/config";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Security Headers (non-CSP only)
 *
 * CSP is defined exclusively in vercel.json to avoid dual-declaration drift.
 * vercel.json headers override next.config.ts on Vercel infrastructure,
 * so maintaining CSP here was dead code in production.
 *
 * These non-CSP headers apply to both local dev and production.
 */
const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
];

const nextConfig: NextConfig = {
  // Explicitly expose NEXT_PUBLIC env vars to client bundle
  // Required because Turbopack dev mode uses process polyfill instead of inlining
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? "false",
  },

  // Set Turbopack root to this project directory (fixes multiple lockfile warning)
  turbopack: {
    root: __dirname,
    resolveAlias: {
      // Ensure scheduler resolves from root node_modules for @react-three/fiber
      scheduler: "scheduler",
    },
  },

  // Transpile @react-three/* so Turbopack handles their internal imports correctly
  // NOTE: 'three' must NOT be here — it conflicts with serverExternalPackages
  transpilePackages: ["@react-three/fiber", "@react-three/drei"],

  // Webpack fallback for production builds — handle Three.js worker files
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Three.js from pulling in Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },

  // Allow Firebase Studio preview domains to access dev server
  allowedDevOrigins: [
    "9002-firebase-studio-1762209011218.cluster-ye3eisvazjh36x6dv44gpklwl6.cloudworkstations.dev",
  ],

  // Redirects — legacy routes + IA Phase 1 dispositions
  async redirects() {
    return [
      // Legacy rebrand (sentinel → guardian → station, collapsed to single hop)
      {
        source: "/sentinel",
        destination: "/station",
        permanent: true,
      },
      // Primitives-first route alignment
      {
        source: "/nucleus/academy/certificates/:path*",
        destination: "/nucleus/academy/verifications/:path*",
        permanent: true,
      },
      {
        source: "/nucleus/academy/learn/:path*",
        destination: "/nucleus/academy/build/:path*",
        permanent: true,
      },
      // IA Phase 1 — Platform merges (8)
      {
        source: "/nucleus/compliance",
        destination: "/nucleus/regulatory",
        permanent: true,
      },
      {
        source: "/nucleus/research",
        destination: "/nucleus/vigilance",
        permanent: true,
      },
      {
        source: "/nucleus/solutions",
        destination: "/nucleus/organization",
        permanent: true,
      },
      {
        source: "/nucleus/ml",
        destination: "/nucleus/tools",
        permanent: true,
      },
      {
        source: "/nucleus/os",
        destination: "/nucleus/tools",
        permanent: true,
      },
      {
        source: "/nucleus/terminal",
        destination: "/nucleus/tools",
        permanent: true,
      },
      {
        source: "/nucleus/insights",
        destination: "/nucleus/vigilance/analytics",
        permanent: true,
      },
      {
        source: "/nucleus/ventures",
        destination: "/nucleus/marketplace",
        permanent: true,
      },
      // IA Phase 1 — Marketing redirects (5)
      // REDIRECT-LOCK: /guardian and /capabilities are redirect sources.
      // Remove the redirect BEFORE creating a page.tsx at these paths,
      // or next.config.ts will silently eat the route.
      {
        source: "/live-feed",
        destination: "/nucleus/live-feed",
        permanent: true,
      },
      {
        source: "/capabilities",
        destination: "/station",
        permanent: true,
      },
      {
        source: "/schedule",
        destination: "/contact",
        permanent: true,
      },
      // Guardian has its own page at (public)/guardian/page.tsx — no redirect needed
      {
        source: "/guardian/docs/quickstart",
        destination: "/guardian",
        permanent: false,
      },
    ];
  },

  images: {
    remotePatterns: [
      // Placeholder services
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      // Firebase Storage (user uploads, course thumbnails)
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      // Google user profile photos (Firebase Auth with Google)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      // GitHub avatars (if GitHub auth enabled)
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      // Gravatar (common fallback for user avatars)
      {
        protocol: "https",
        hostname: "gravatar.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Security and Caching Headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Cache static assets for 1 year (immutable - content-hashed)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache images for 1 week with revalidation
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache generated intelligence images for 1 week
        source: "/images/intelligence/generated/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache fonts for 1 year
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache favicon and other root assets for 1 week
        source: "/(favicon.ico|site.webmanifest|robots.txt|sitemap.xml)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

const sentryWrapped = withSentryConfig(withBotId(bundleAnalyzer(nextConfig)), {
  // Upload source maps to Sentry for readable stack traces
  org: "nexvigilanc-llc",
  project: "nucleus",
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source map upload warnings in dev
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Tree-shake Sentry debug code in production
  disableLogger: true,

  // Control source map upload
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});

export default sentryWrapped;
