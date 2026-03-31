# Marketing Component Library

> **Version:** 1.0.0
> **Status:** Production Ready
> **Maintained By:** NexVigilant Development Team

Reusable, brand-aligned components for marketing pages that implement NexVigilant's design philosophy: **understated elegance, world-class craftsmanship, and modern functionality**.

---

## Table of Contents

- [Installation](#installation)
- [Components](#components)
  - [PageHero](#pagehero)
  - [ServiceCard](#servicecard)
  - [FeatureGrid](#featuregrid)
- [Design Philosophy](#design-philosophy)
- [Usage Guidelines](#usage-guidelines)
- [Examples](#examples)

---

## Installation

Components are available via barrel export:

```tsx
import { PageHero, ServiceCard, FeatureGrid } from '@/components/marketing';
```

Individual imports:

```tsx
import { PageHero } from '@/components/marketing/page-hero';
```

---

## Components

### PageHero

Reusable hero section for marketing pages with consistent brand styling.

**Features:**
- PCB grid background pattern
- Radial energy effect (optional)
- Animated gradient text
- Responsive sizing (sm, default, lg)
- Optional icon display
- Custom content support

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Main heading text |
| `description` | `string` | - | Subtitle or description |
| `icon` | `LucideIcon` | - | Optional icon component |
| `iconClassName` | `string` | `'text-primary'` | Icon color class |
| `children` | `ReactNode` | - | Additional content below description |
| `className` | `string` | - | Additional CSS classes |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size variant |
| `showRadialEffect` | `boolean` | `true` | Show radial energy effect |

**Examples:**

```tsx
// Basic usage
<PageHero
  title="About Us"
  description="Learn about our mission to safeguard patient health"
/>

// With icon
<PageHero
  title="Services"
  description="Professional pharmaceutical oversight"
  icon={ShieldCheck}
  iconClassName="text-nex-cyan-500"
/>

// With custom content
<PageHero
  title="Join the Movement"
  description="Be part of independent pharmaceutical vigilance"
  size="lg"
>
  <div className="flex gap-4 justify-center mt-6">
    <Button size="lg">Sign Up</Button>
    <Button size="lg" variant="outline">Learn More</Button>
  </div>
</PageHero>

// Minimal version
<PageHero
  title="Privacy Policy"
  size="sm"
  showRadialEffect={false}
/>
```

---

### ServiceCard

Reusable card for displaying services, features, or offerings with holographic styling.

**Features:**
- Glass-morphism effect
- Consistent icon treatment
- Optional CTA button
- Feature list support
- Multiple styling variants
- Hover effects with subtle lift

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | Service or feature title |
| `description` | `string` | Required | Brief description |
| `icon` | `LucideIcon` | - | Optional icon |
| `iconClassName` | `string` | `'text-primary'` | Icon color class |
| `href` | `string` | - | Link destination (makes card clickable) |
| `ctaText` | `string` | `'Learn More'` | CTA button text |
| `features` | `string[]` | - | Feature bullet points |
| `className` | `string` | - | Additional CSS classes |
| `variant` | `'default' \| 'elevated' \| 'flat'` | `'default'` | Card styling variant |
| `badge` | `string` | - | Optional badge text (e.g., "New") |

**Examples:**

```tsx
// Basic service card
<ServiceCard
  title="Pharmacovigilance"
  description="Independent safety surveillance and signal detection"
  icon={ShieldCheck}
  href="/services/guardian"
/>

// With features list
<ServiceCard
  title="NexVigilant Academy"
  description="Build pharmaceutical capabilities through skills-based learning"
  icon={BookOpen}
  features={[
    "Industry-recognized certifications",
    "Practical, hands-on training",
    "Career advancement pathways"
  ]}
  href="/nucleus/academy"
  badge="Live"
/>

// Elevated variant for emphasis
<ServiceCard
  title="Ventures"
  description="Innovation and entrepreneurship in pharma"
  icon={Zap}
  variant="elevated"
  iconClassName="text-nex-gold-500"
/>

// Static card (no link)
<ServiceCard
  title="Coming Soon"
  description="Exciting new features in development"
  variant="flat"
/>
```

---

### FeatureGrid

Responsive grid layout for displaying features, benefits, or capabilities.

**Features:**
- Responsive grid columns
- Consistent icon treatment
- Multiple styling variants
- Hover effects
- Flexible spacing

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `features` | `Feature[]` | Required | Array of features to display |
| `columns` | `object` | `{ sm: 1, md: 2, lg: 3 }` | Responsive column configuration |
| `className` | `string` | - | Additional CSS classes |
| `variant` | `'default' \| 'minimal' \| 'bordered'` | `'default'` | Styling variant |

**Feature Type:**

```typescript
interface Feature {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconClassName?: string;
}
```

**Examples:**

```tsx
// Standard 3-column grid
<FeatureGrid
  features={[
    {
      title: "Independent Oversight",
      description: "Unbiased pharmaceutical safety surveillance",
      icon: ShieldCheck
    },
    {
      title: "Professional Development",
      description: "Skills-based capability building",
      icon: BookOpen
    },
    {
      title: "Community Network",
      description: "Connect with pharmaceutical professionals",
      icon: Users
    }
  ]}
/>

// Custom column layout
<FeatureGrid
  features={features}
  columns={{ sm: 1, md: 2, lg: 4 }}
  variant="bordered"
/>

// Minimal styling
<FeatureGrid
  features={quickFeatures}
  variant="minimal"
  className="mt-8"
/>
```

---

## Design Philosophy

All components implement NexVigilant's design principles:

### 1. Understated Elegance
- Muted, sophisticated color palettes
- Subtle animations (200-400ms)
- Purposeful whitespace
- No unnecessary decoration

### 2. World-Class Craftsmanship
- Polished edges and refined transitions
- Precise alignment and consistent spacing
- Thoughtful micro-interactions
- Metallic visual treatments (holographic cards)

### 3. Modern Functionality
- Mobile-first responsive design
- Intuitive navigation patterns
- Fast, smooth performance
- WCAG 2.1 AA accessibility

### 4. Trusted Companion
- Consistent, predictable interfaces
- Clear status indicators
- Helpful, non-intrusive guidance
- Calm, professional tone

---

## Usage Guidelines

### Color Usage

Components automatically use brand colors:

- **Primary:** `text-primary` / `bg-primary` (cyan-500)
- **Secondary:** `text-secondary` / `bg-secondary` (gold-500)
- **Muted:** `text-muted-foreground` / `bg-muted` (gray tones)

Override with specific brand colors when needed:

```tsx
<PageHero
  icon={ShieldCheck}
  iconClassName="text-nex-cyan-500"  // Explicit brand color
/>

<ServiceCard
  icon={Zap}
  iconClassName="text-nex-gold-500"  // Secondary brand color
/>
```

### Spacing

Components use consistent spacing scale (8px base):

- **Component gaps:** `gap-4` (16px), `gap-6` (24px)
- **Section margins:** `mb-12` (48px), `mb-16` (64px)
- **Padding:** `p-4` (16px), `p-6` (24px)

### Typography

Components automatically apply:

- **Headlines:** `font-headline` (Space Grotesk)
- **Body:** Default (Inter)
- **Hierarchy:** Consistent sizing (text-4xl, text-2xl, text-lg, text-sm)

---

## Examples

### Complete Page Example

```tsx
import { PageHero, ServiceCard, FeatureGrid } from '@/components/marketing';
import { ShieldCheck, BookOpen, Users, Zap } from 'lucide-react';

export default function ServicesPage() {
  const features = [
    {
      title: "Safety Surveillance",
      description: "Real-time pharmaceutical safety monitoring",
      icon: ShieldCheck
    },
    // ... more features
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <PageHero
        title="Our Services"
        description="Comprehensive pharmaceutical oversight and professional development"
        icon={ShieldCheck}
        size="lg"
      />

      {/* Service Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        <ServiceCard
          title="Guardian"
          description="Independent pharmacovigilance services"
          icon={ShieldCheck}
          href="/services/guardian"
          features={[
            "Signal detection",
            "Case processing",
            "Regulatory reporting"
          ]}
        />
        <ServiceCard
          title="Academy"
          description="Professional capability building"
          icon={BookOpen}
          href="/nucleus/academy"
          badge="Live"
        />
      </div>

      {/* Features Grid */}
      <FeatureGrid
        features={features}
        columns={{ sm: 1, md: 2, lg: 3 }}
        variant="bordered"
      />
    </div>
  );
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-14 | Initial component library release |

---

## Related Documentation

- `docs/branding/BrandColors.md` - Color specifications
- `docs/branding/Design-Philosophy-and-Visual-Identity.md` - Design principles
- `docs/branding/Brand-Alignment-Audit-2025-11-14.md` - Latest audit

**Questions?** Refer to brand documentation before making changes.
