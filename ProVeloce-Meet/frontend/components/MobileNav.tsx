'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, Calendar, Clock, Video, History, User, X } from 'lucide-react';
import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { timing, easing, stagger, prefersReducedMotion, backdropVariants } from '@/lib/motion';

// Navigation items with icons
const navItems = [
  { label: 'Home', route: '/home', Icon: Home },
  { label: 'Upcoming', route: '/upcoming', Icon: Calendar },
  { label: 'Previous', route: '/previous', Icon: Clock },
  { label: 'Recordings', route: '/recordings', Icon: Video },
  { label: 'History', route: '/history', Icon: History },
  { label: 'Personal Room', route: '/personal-room', Icon: User },
];

// Drawer animation variants
const drawerVariants = {
  hidden: {
    x: '-100%',
    transition: {
      duration: timing.normal,
      ease: easing.smooth
    }
  },
  visible: {
    x: 0,
    transition: {
      duration: timing.normal,
      ease: easing.bounce // Slight overshoot and settle
    }
  },
};

// Nav item animation variants
const navItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: timing.normal,
      ease: easing.smooth
    }
  },
};

// Container for staggered nav items
const navContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.fast,
      delayChildren: 0.15,
    },
  },
};

const MobileNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Menu Button */}
      <motion.button
        onClick={toggleMenu}
        className="inline-flex items-center justify-center rounded-full p-2 text-text-primary hover:bg-bg-tertiary transition-colors sm:hidden touch-target"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </motion.button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              key="mobile-nav-backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] sm:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />

            {/* Slide-out drawer */}
            <motion.div
              key="mobile-nav-drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed top-0 left-0 h-full w-[280px] bg-white z-[70] sm:hidden shadow-xl"
              aria-hidden={!isOpen}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-lighter safe-top">
                <Link
                  href="/home"
                  className="flex items-center gap-2"
                  onClick={closeMenu}
                >
                  <motion.div
                    initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: timing.normal, delay: 0.1 }}
                  >
                    <Image
                      src="/icons/ProMeet.png"
                      width={32}
                      height={32}
                      alt="ProVeloce Meet"
                      className="w-8 h-8 rounded"
                    />
                  </motion.div>
                  <motion.span
                    className="text-lg font-semibold text-text-primary"
                    initial={reducedMotion ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: timing.normal, delay: 0.15 }}
                  >
                    ProVeloce Meet
                  </motion.span>
                </Link>

                <motion.button
                  onClick={closeMenu}
                  className="p-2 rounded-full hover:bg-bg-tertiary transition-colors touch-target"
                  aria-label="Close menu"
                  whileHover={reducedMotion ? undefined : { rotate: 90 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                  transition={{ duration: timing.fast }}
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </motion.button>
              </div>

              {/* Navigation Links */}
              <nav className="p-3 overflow-y-auto h-[calc(100%-70px)]" aria-label="Mobile navigation">
                <motion.ul
                  className="flex flex-col gap-1"
                  variants={navContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.route ||
                      (item.route !== '/home' && pathname.startsWith(`${item.route}/`));
                    const Icon = item.Icon;

                    return (
                      <motion.li
                        key={item.route}
                        variants={navItemVariants}
                      >
                        <Link
                          href={item.route}
                          onClick={closeMenu}
                          className={cn(
                            'flex gap-3 items-center px-4 py-3 rounded-full w-full transition-colors touch-target',
                            isActive
                              ? 'bg-google-blue-light text-google-blue font-medium'
                              : 'text-text-secondary hover:bg-bg-tertiary active:bg-bg-hover'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <motion.div
                            whileHover={reducedMotion ? undefined : { scale: 1.1 }}
                            transition={{ duration: timing.fast }}
                          >
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </motion.div>
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(MobileNav);
