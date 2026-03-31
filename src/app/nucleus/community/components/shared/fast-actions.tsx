'use client';

import { 
  PlusSquare, 
  MessageSquarePlus, 
  UserPlus, 
  Compass, 
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const ACTIONS = [
  {
    label: 'New Post',
    description: 'Share knowledge',
    href: '/nucleus/community/circles/create-post',
    icon: PlusSquare,
    color: 'text-cyan',
    bgColor: 'bg-cyan/10',
  },
  {
    label: 'Message',
    description: 'Connect directly',
    href: '/nucleus/community/messages',
    icon: MessageSquarePlus,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
  },
  {
    label: 'Find Members',
    description: 'Expand network',
    href: '/nucleus/community/members',
    icon: UserPlus,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    label: 'Discovery',
    description: 'Find your home',
    href: '/nucleus/community/discover',
    icon: Compass,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
];

export function FastActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.href} href={action.href} className="group">
            <Card className="h-full bg-nex-surface border-nex-border hover:border-cyan/50 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={cn(
                  "mb-3 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
                  action.bgColor,
                  action.color
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-cyan transition-colors">
                  {action.label}
                </h3>
                <p className="text-[10px] text-slate-dim uppercase tracking-wider mt-1">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
