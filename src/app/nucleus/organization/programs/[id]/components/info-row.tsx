import type { LucideIcon } from 'lucide-react';

export function InfoRow({ icon: Icon, label, value }: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-dim shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-dim">{label}</p>
        <p className="text-sm text-slate-light capitalize">{value}</p>
      </div>
    </div>
  );
}
