import { type LucideIcon } from 'lucide-react';

export interface NucleusService {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  color: string;
  // Angle in degrees from top (0 = top, 90 = right, 180 = bottom, 270 = left)
  angle: number;
  delay: string;
  isLive?: boolean;
}

export interface OrbPosition {
  x: number;
  y: number;
  scale: number;
  size: number;
  visible: boolean;
}
