'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Clock, Video, History, User } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

// Navigation items matching MobileNav
const navItems = [
  { label: 'Home', route: '/home', Icon: Home },
  { label: 'Upcoming', route: '/upcoming', Icon: Calendar },
  { label: 'Previous', route: '/previous', Icon: Clock },
  { label: 'Recordings', route: '/recordings', Icon: Video },
  { label: 'History', route: '/history', Icon: History },
  { label: 'Personal Room', route: '/personal-room', Icon: User },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className="sticky left-0 top-16 flex h-[calc(100vh-4rem)] w-fit flex-col bg-white border-r border-border-lighter p-3 max-sm:hidden lg:w-[240px]"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.route ||
            (item.route !== '/home' && pathname.startsWith(`${item.route}/`));
          const Icon = item.Icon;

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                'flex gap-3 items-center px-3 py-2.5 rounded-full transition-colors touch-target',
                isActive
                  ? 'bg-google-blue-light text-google-blue font-medium'
                  : 'text-text-secondary hover:bg-bg-tertiary'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm max-lg:hidden truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default memo(Sidebar);
