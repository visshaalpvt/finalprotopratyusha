'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { memo } from 'react';

import MobileNav from './MobileNav';
import ThemeToggle from './ThemeToggle';

const Navbar = memo(function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-dark-1 border-b border-border-lighter dark:border-dark-3 transition-colors"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="ProVeloce Meet Home"
        >
          <Image
            src="/icons/ProMeet.png"
            width={32}
            height={32}
            alt="ProVeloce Meet"
            className="w-8 h-8 rounded"
            priority
          />
          <span className="text-lg font-medium text-text-primary hidden sm:block">
            ProVeloce Meet
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          <SignedIn>
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-lg border border-border-lighter",
                },
              }}
            />
          </SignedIn>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
