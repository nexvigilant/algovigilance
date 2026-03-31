import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function QuickAction({ icon: Icon, label, description, href, disabled, onClick }: {
  icon: LucideIcon;
  label: string;
  description: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border border-nex-light transition-all',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-cyan/50 hover:bg-cyan/5 cursor-pointer'
      )}
      onClick={!disabled && !href ? onClick : undefined}
    >
      <div className="rounded-lg bg-nex-dark p-2 mt-0.5">
        <Icon className="h-4 w-4 text-slate-dim" />
      </div>
      <div>
        <p className="font-medium text-slate-light text-sm">{label}</p>
        <p className="text-xs text-slate-dim">{description}</p>
      </div>
    </div>
  );

  if (href && !disabled) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
