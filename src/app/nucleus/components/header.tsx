'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { IntelligentSearch } from './intelligent-search';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { resetAnalytics } from '@/lib/analytics';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { logger } from '@/lib/logger';
const log = logger.scope('components/header');

export function NucleusHeader() {
  const { user } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Track sign out event
      track('user_signed_out');
      resetAnalytics();

      await signOut(auth);
      router.push('/');
    } catch (error) {
      log.error('Error signing out:', error);
    }
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-8">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold md:text-2xl font-headline">AlgoVigilance Nucleus</h1>
      </div>
      <div className="flex items-center gap-4">
        <IntelligentSearch />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-11 w-11 touch-target min-w-[44px] rounded-full"
              aria-label={`User menu for ${user?.displayName || user?.email || 'current user'}`}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-cyan/20 text-cyan-glow font-semibold" aria-hidden="true">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/nucleus/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/nucleus/insights')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Insights</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Backward compatibility alias
export { NucleusHeader as DashboardHeader };
