/**
 * Contact Thank You Page Content Data
 *
 * Post-submission confirmation copy and next-step card content.
 *
 * @module data/thank-you-content
 */

// ============================================================================
// Confirmation Copy
// ============================================================================

export const THANK_YOU_HERO = {
  title: 'Message',
  titleHighlight: 'Received',
  subtitle: 'Thank you for reaching out. Our team is reviewing your message.',
  responseTime: '24-48 hours',
  responseDescription: "We'll reach out to the email address you provided.",
} as const;

// ============================================================================
// Next Steps Cards
// ============================================================================

/**
 * Tailwind-safe class strings — complete class names so the purger finds them.
 * Do NOT construct these dynamically (e.g., `border-${x}/20`).
 */
export interface NextStepCard {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  icon: 'calendar' | 'users' | 'book';
  cardClass: string;
  iconClass: string;
  buttonClass: string;
}

export const NEXT_STEP_CARDS: NextStepCard[] = [
  {
    title: 'Schedule a Call',
    description: 'Skip the wait—book a consultation directly.',
    ctaText: 'Book Now',
    ctaHref: '__SCHEDULE__', // replaced with CONTACT_ROUTES.schedule at render time
    icon: 'calendar',
    cardClass: 'border border-cyan/20 bg-cyan/5',
    iconClass: 'h-8 w-8 text-cyan mx-auto mb-3',
    buttonClass: 'w-full border-cyan text-cyan hover:bg-cyan/10',
  },
  {
    title: 'Join the Community',
    description: 'Connect with practitioners while you wait.',
    ctaText: 'Explore',
    ctaHref: '/community',
    icon: 'users',
    cardClass: 'border border-gold/20 bg-gold/5',
    iconClass: 'h-8 w-8 text-gold mx-auto mb-3',
    buttonClass: 'w-full border-gold text-gold hover:bg-gold/10',
  },
  {
    title: 'Read Our Insights',
    description: 'Explore our latest industry analysis.',
    ctaText: 'Browse',
    ctaHref: '/intelligence',
    icon: 'book',
    cardClass: 'border border-purple-400/20 bg-purple-400/5',
    iconClass: 'h-8 w-8 text-purple-400 mx-auto mb-3',
    buttonClass: 'w-full border-purple-400 text-purple-400 hover:bg-purple-400/10',
  },
];
