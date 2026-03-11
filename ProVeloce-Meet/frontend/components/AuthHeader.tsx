'use client';

import { useState } from 'react';
import { SignedOut } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import AuthModal from './AuthModal';
import { fadeInLeft } from '@/lib/animations';

const AuthHeader = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <>
      <header className="flex justify-between items-center p-4 gap-3 sm:gap-4 h-16 bg-white border-b border-light-4 shadow-sm">
        {/* Logo and Company Name */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInLeft}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 rounded-md"
            aria-label="ProVeloce Meet Home"
          >
            <div className="logo-gradient-wrapper relative">
              <Image
                src="/icons/ProMeet.png"
                width={32}
                height={32}
                alt="ProVeloce Meet logo"
                className="w-8 h-8 sm:w-9 sm:h-9 logo-gradient"
                priority
              />
            </div>
            <motion.p
              className="text-xl sm:text-2xl font-bold gradient-text max-sm:hidden"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              ProVeloce Meet
            </motion.p>
          </Link>
        </motion.div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3 sm:gap-4">
          <SignedOut>
            <button
              onClick={() => {
                setAuthMode('sign-in');
                setIsAuthModalOpen(true);
              }}
              className="text-sm sm:text-base font-medium text-text-primary hover:text-google-blue transition-colors px-3 py-2 rounded-md hover:bg-light-2 focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2"
              aria-label="Sign in to ProVeloce Meet"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('sign-up');
                setIsAuthModalOpen(true);
              }}
              className="bg-google-blue text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-11 px-5 sm:px-6 cursor-pointer hover:bg-google-blue-dark transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sign up for ProVeloce Meet"
            >
              Sign Up
            </button>
          </SignedOut>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default AuthHeader;

