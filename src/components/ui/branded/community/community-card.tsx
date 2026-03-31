import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CommunityCardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
  padded?: boolean;
}

/**
 * Standard card for Community components (Circles, Members, etc.)
 */
export function CommunityCard({
  children,
  className,
  hoverGlow = true,
  padded = true
}: CommunityCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-cyan/20 bg-nex-light/50',
        'transition-all duration-200 hover:border-cyan/40 hover:bg-nex-light',
        hoverGlow && 'hover:shadow-lg hover:shadow-cyan/5',
        padded ? 'p-0' : '', // Padded handling depends on if Link is used inside
        className
      )}
    >
      {children}
    </Card>
  );
}
