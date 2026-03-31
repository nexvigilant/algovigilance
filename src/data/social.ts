/**
 * Social Links
 *
 * External social media links used in site footer.
 *
 * @module data/social
 */

import type { LucideIcon } from "lucide-react";
import { Linkedin, Twitter, Github, Youtube } from "lucide-react";

export interface SocialLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: "https://linkedin.com/company/nexvigilant",
    icon: Linkedin,
    label: "LinkedIn",
  },
  { href: "https://twitter.com/nexvigilant", icon: Twitter, label: "Twitter" },
  { href: "https://github.com/nexvigilant", icon: Github, label: "GitHub" },
  { href: "https://youtube.com/@nexvigilant", icon: Youtube, label: "YouTube" },
];
