import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "320px", // Ultra-narrow viewport support
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      /* Golden Scale Typography (φ = 1.618)
       * @see docs/design-system/GOLDEN-ARCHITECTURE.md */
      fontSize: {
        "golden-3xs": ["0.382rem", { lineHeight: "1.5" }], // 6.11px
        "golden-2xs": ["0.618rem", { lineHeight: "1.5" }], // 9.89px
        "golden-xs": ["0.764rem", { lineHeight: "1.5" }], // 12.22px
        "golden-sm": ["0.875rem", { lineHeight: "1.618" }], // 14px
        "golden-base": ["1rem", { lineHeight: "1.618" }], // 16px
        "golden-lg": ["1.236rem", { lineHeight: "1.5" }], // 19.78px
        "golden-xl": ["1.618rem", { lineHeight: "1.382" }], // 25.89px
        "golden-2xl": ["2.618rem", { lineHeight: "1.2" }], // 41.89px
        "golden-3xl": ["4.236rem", { lineHeight: "1.1" }], // 67.78px
        "golden-4xl": ["6.854rem", { lineHeight: "1.05" }], // 109.66px
      },
      /* Golden Spacing Scale (8pt base × φⁿ) */
      spacing: {
        "golden-1": "0.5rem", // 8px
        "golden-2": "0.809rem", // 12.94px
        "golden-3": "1.309rem", // 20.94px
        "golden-4": "2.118rem", // 33.88px
        "golden-5": "3.426rem", // 54.82px
        "golden-6": "5.544rem", // 88.70px
        "golden-7": "8.970rem", // 143.52px
        "golden-8": "14.514rem", // 232.22px
      },
      /* Design opacity tokens — replace arbitrary values */
      opacity: {
        "ultra-faint": "0.02",
        faint: "0.03",
        subtle: "0.08",
      },
      /* Golden Line Heights */
      lineHeight: {
        golden: "1.618",
        "golden-snug": "1.382",
        "golden-relaxed": "1.854",
      },
      /* Golden Max Widths */
      maxWidth: {
        reading: "65ch",
        "golden-narrow": "50rem",
        "golden-normal": "65rem",
        "golden-wide": "75rem",
      },
      fontFamily: {
        body: ["var(--font-inter)", "sans-serif"],
        headline: ["var(--font-space-grotesk)", "sans-serif"],
        code: ["monospace"],
      },
      colors: {
        // THE VOID (Backgrounds) - Navy scale from globals.css HSL values
        // Single source of truth: globals.css CSS variables
        nex: {
          // Charcoal Steel — semantic aliases (single source of truth)
          deep: "hsl(215 15% 5%)", // Deepest backgrounds
          dark: "hsl(215 15% 8%)", // Secondary backgrounds
          surface: "hsl(215 12% 14%)", // Cards, modals
          light: "hsl(215 10% 20%)", // Elevated surfaces
          border: "hsl(215 8% 28%)", // Borders, dividers
          // Steel blue scale for nex-cyan-* classes (was cyan)
          "cyan-600": "hsl(215 25% 40%)", // Darker steel
          "cyan-500": "hsl(215 30% 53%)", // Primary steel blue
          "cyan-400": "hsl(215 35% 60%)", // Bright steel
          "cyan-300": "hsl(215 30% 70%)", // Light steel
          "cyan-200": "hsl(215 25% 82%)", // Lighter steel
        },
        // STEEL BLUE (Accent / Labels — was cyan)
        cyan: {
          DEFAULT: "#7B95B5", // Steel blue accent
          glow: "#94ABC5", // Hover / Active State
          soft: "hsl(215 30% 70%)", // Light accents
          muted: "hsl(215 20% 45%)", // Subdued/dark
          dark: "hsl(215 20% 35%)", // Darker steel
          deep: "hsl(215 15% 20%)", // Very dark
          pale: "hsl(215 25% 82%)", // Very light
          faint: "hsl(215 20% 92%)", // Almost white
          dim: "rgba(123, 149, 181, 0.1)",
        },
        // EMBER — legacy alias, mapped to cyan for backward compatibility
        // TODO: Remove ember references from components over time
        ember: {
          DEFAULT: "#7B95B5", // Mapped to cyan
          glow: "#94ABC5", // Mapped to cyan-glow
          soft: "#B8CCE0", // Light steel
          muted: "#4A6580", // Dark steel
          dark: "#2A3F55", // Very dark steel
          deep: "#1A2535", // Deepest steel
          pale: "#D4E3F0", // Very light steel
          faint: "#EEF3F8", // Almost white
          dim: "rgba(123, 149, 181, 0.1)",
        },
        // THE AUTHORITY (Headers / Status) - Expanded Metallic Range
        gold: {
          DEFAULT: "#D4AF37", // Primary Text / Borders
          bright: "#F4D03F", // Highlights
          dim: "rgba(212, 175, 55, 0.1)",
          // Emerald City Metallic Gold Scale
          "metallic-100": "#FFF8DC", // Champagne highlight (lightest)
          "metallic-200": "#FFEAA7", // Pale gold
          "metallic-300": "#FFD700", // Brilliant gold
          "metallic-400": "#F4D03F", // Bright gold (same as bright)
          "metallic-500": "#D4AF37", // Standard gold (same as DEFAULT)
          "metallic-600": "#C9A227", // Rich gold
          "metallic-700": "#B8860B", // Dark gold
          "metallic-800": "#996515", // Bronze-gold
          "metallic-900": "#8B4513", // Deep bronze
          // Semantic metallic aliases
          shimmer: "#FFE4B5", // Moccasin shimmer
          gleam: "#FFD700", // Pure gold gleam
          antique: "#CFB53B", // Old gold / antique
        },
        // TEXT
        slate: {
          light: "#E6F1FF", // Body Text
          dim: "#a8b2d1", // Secondary Text (WCAG AA compliant - ~5:1 contrast)
        },
        background: "#0B0D13", // Charcoal steel deep
        foreground: "#E6F1FF", // Mapped to slate-light
        card: {
          DEFAULT: "#1E2430", // Charcoal steel surface
          foreground: "#E6F1FF",
        },
        popover: {
          DEFAULT: "#1A1F2A", // Charcoal steel card
          foreground: "#E6F1FF",
        },
        primary: {
          DEFAULT: "#7B95B5", // Mapped to cyan (steel blue)
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#D4AF37", // Mapped to gold
          foreground: "#0B0D13",
        },
        muted: {
          DEFAULT: "#141820", // Charcoal steel dark
          foreground: "#a8b2d1", // Mapped to slate-dim (WCAG AA compliant)
        },
        accent: {
          DEFAULT: "#1E2430",
          foreground: "#7B95B5",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "#2A303C", // Charcoal steel border
        input: "#2A303C",
        ring: "#7B95B5",
        sidebar: {
          DEFAULT: "#141820",
          foreground: "#E6F1FF",
          primary: "#7B95B5",
          "primary-foreground": "#FFFFFF",
          accent: "#1E2430",
          "accent-foreground": "#E6F1FF",
          border: "#2A303C",
          ring: "#7B95B5",
        },
      },
      boxShadow: {
        // Brand glows — actively used across components
        "glow-cyan":
          "0 0 10px rgba(var(--nex-cyan-rgb), 0.5), 0 0 20px rgba(var(--nex-cyan-rgb), 0.3)",
        "glow-gold":
          "0 0 10px rgba(var(--nex-gold-rgb), 0.5), 0 0 20px rgba(var(--nex-gold-rgb), 0.3)",
        "card-hover": "0 10px 30px -10px rgba(var(--nex-navy-deep-rgb), 0.7)",
      },
      // Text shadows for hero headings - use CSS variables
      textShadow: {
        none: "none",
        sm: "0 1px 2px rgba(var(--nex-black-rgb), 0.5)",
        DEFAULT: "0 2px 4px rgba(var(--nex-black-rgb), 0.5)",
        lg: "0 4px 8px rgba(var(--nex-black-rgb), 0.6)",
        "cyan-glow":
          "0 0 40px rgba(var(--nex-cyan-rgb), 0.3), 0 2px 4px rgba(var(--nex-black-rgb), 0.8)",
        "gold-glow":
          "0 0 40px rgba(var(--nex-gold-rgb), 0.3), 0 2px 4px rgba(var(--nex-black-rgb), 0.8)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // NOTE: Different from CSS shimmer - uses translateX for loading states
        // CSS shimmer uses background-position for gradient sweeps
        shimmer: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        // Deduplicated keyframes: metallic-sweep, pulse-slow, shimmer-slow,
        // float-particle, prismatic-sweep, bokeh, city-glow — canonical
        // definitions live in CSS @layer animations (globals.css / emerald-city.css).
        // Animation utility mappings below still reference them by name.
        "specular-flash": {
          "0%, 90%, 100%": { opacity: "0", transform: "scale(0.8)" },
          "95%": { opacity: "1", transform: "scale(1)" },
        },
        "crystal-shimmer": {
          "0%": { backgroundPosition: "-200% 0", opacity: "0.5" },
          "50%": { opacity: "0.8" },
          "100%": { backgroundPosition: "200% 0", opacity: "0.5" },
        },
        "facet-glint": {
          "0%, 100%": {
            opacity: "0.2",
            transform: "translateX(0) rotate(0deg)",
          },
          "50%": { opacity: "0.6", transform: "translateX(5px) rotate(2deg)" },
        },
        // Electric pulse animations for PV Mission Bar
        "electric-pulse-right": {
          "0%": { left: "-80px", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { left: "100%", opacity: "0" },
        },
        "electric-pulse-left": {
          "0%": { right: "-80px", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { right: "100%", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        // Emerald City animations
        "metallic-sweep": "metallic-sweep 8s ease-in-out infinite",
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
        "shimmer-slow": "shimmer-slow 8s ease-in-out infinite",
        "float-particle": "float-particle 15s ease-in-out infinite",
        // Crystal animations
        "prismatic-sweep": "prismatic-sweep 12s ease-in-out infinite",
        "specular-flash": "specular-flash 10s ease-in-out infinite",
        "crystal-shimmer": "crystal-shimmer 6s ease-in-out infinite",
        "facet-glint": "facet-glint 4s ease-in-out infinite",
        // Prismatic rays animations
        bokeh: "bokeh-float 20s ease-in-out infinite",
        "city-glow": "city-glow 6s ease-in-out infinite",
        // Electric pulse animations
        "electric-pulse-right": "electric-pulse-right 2s ease-in-out infinite",
        "electric-pulse-left": "electric-pulse-left 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Text shadow plugin - generates text-shadow-* utilities from theme.textShadow
    function ({
      matchUtilities,
      theme,
    }: {
      matchUtilities: Function;
      theme: Function;
    }) {
      matchUtilities(
        {
          "text-shadow": (value: string) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") },
      );
    },
  ],
} satisfies Config;
