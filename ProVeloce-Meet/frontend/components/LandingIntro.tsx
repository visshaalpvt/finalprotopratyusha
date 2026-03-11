'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Shield, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import AuthModal from './AuthModal';
import { HeroTitle, TaglineReveal } from './motion';
import { MagneticWrapper, SpotlightCard } from './motion/AdvancedMotion';
import { ParticleBackground } from './motion/ParticleBackground';
import {
  timing,
  easing,
  fadeUpVariants,
  stagger,
  prefersReducedMotion
} from '@/lib/motion';

const LandingIntro = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  const features = [
    {
      icon: Video,
      title: 'Secure HD Video Calling',
      description: 'Crystal-clear video quality with enterprise-grade security',
    },
    {
      icon: Shield,
      title: 'Encrypted Meetings',
      description: 'End-to-end encryption with host controls for privacy',
    },
    {
      icon: Users,
      title: 'Real-time Collaboration',
      description: 'Screen sharing, chat, and seamless team collaboration',
    },
  ];

  const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

  // Stagger container for features
  const featuresContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger.slow,
        delayChildren: 1.0,
      },
    },
  };

  // Feature card variants with directional animation
  const getFeatureVariants = (index: number) => ({
    hidden: {
      opacity: 0,
      x: index === 0 ? -30 : index === 2 ? 30 : 0,
      y: index === 1 ? 30 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: timing.cinematic,
        ease: easing.smooth
      }
    }
  });

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gradient-to-br from-light-2 via-white to-light-2 overflow-hidden relative">
      <ParticleBackground />

      <div className="w-full max-w-4xl mx-auto text-center relative z-10">
        {/* Logo with scale animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: timing.hero,
            ease: easing.bounce,
            delay: 0.1
          }}
          className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          {/* Animated logo with glow */}
          <motion.div
            className="logo-gradient-wrapper relative"
            initial={{ filter: 'blur(10px)' }}
            animate={{ filter: 'blur(0px)' }}
            transition={{ duration: timing.hero, delay: 0.2 }}
          >
            <Image
              src="/icons/ProMeet.png"
              alt="ProVeloce Meet Logo"
              width={64}
              height={64}
              className="logo-gradient h-14 w-14 sm:h-16 sm:w-16 rounded-lg shadow-lg"
            />
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-lg bg-google-blue/20 blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3] }}
              transition={{
                duration: 2,
                delay: 0.5,
                times: [0, 0.5, 1]
              }}
            />
          </motion.div>

          {/* Hero Title with character reveal */}
          <HeroTitle
            text="ProVeloce Meet"
            delay={0.3}
          />
        </motion.div>

        {/* Tagline with word reveal */}
        <div className="mb-4 sm:mb-6">
          <TaglineReveal
            text="Smart & seamless video meetings for teams and individuals"
            delay={0.8}
          />
        </div>

        {/* Description with fade-up */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          transition={{ delay: 1.2 }}
          className="max-w-2xl mx-auto space-y-3 mb-8 sm:mb-12"
        >
          <motion.p
            className="text-lg sm:text-xl text-text-secondary leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: timing.cinematic, delay: 1.3, ease: easing.smooth }}
          >
            Professional video conferencing platform designed for modern teams. Host secure online meetings with real-time collaboration, instant messaging, and meeting recording.
          </motion.p>
          <motion.p
            className="text-lg sm:text-xl text-text-secondary leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: timing.cinematic, delay: 1.5, ease: easing.smooth }}
          >
            Start instant meetings, schedule sessions, or create personal rooms — all with enterprise-grade security and crystal-clear video quality.
          </motion.p>
        </motion.div>

        {/* Feature Highlights with staggered entrance */}
        <motion.div
          variants={featuresContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={getFeatureVariants(index)}
              >
                <SpotlightCard className="h-full p-4 sm:p-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <motion.div
                      className="p-3 bg-google-blue/10 rounded-lg"
                      whileHover={!reducedMotion ? {
                        scale: 1.1,
                        backgroundColor: 'rgba(26, 115, 232, 0.15)'
                      } : undefined}
                      transition={{ duration: timing.fast }}
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-google-blue" />
                    </motion.div>
                    <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Buttons with glow animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: timing.cinematic,
            delay: 1.6,
            ease: easing.smooth
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {/* Login Button */}
          <MagneticWrapper>
            <motion.button
              onClick={() => {
                setAuthMode('sign-in');
                setIsAuthModalOpen(true);
              }}
              className="cta-button-primary w-full sm:w-auto min-w-[200px] bg-google-blue text-white rounded-full font-semibold text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 cursor-pointer relative overflow-hidden shadow-lg focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 flex items-center justify-center gap-2 group"
              aria-label="Sign in to ProVeloce Meet"
              whileHover={!reducedMotion ? {
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(26, 115, 232, 0.4)'
              } : undefined}
              whileTap={!reducedMotion ? { scale: 0.98 } : undefined}
              transition={{ duration: timing.fast }}
            >
              {/* Glow pulse animation */}
              <motion.span
                className="absolute inset-0 bg-white/20 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  delay: 2,
                }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Login
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </MagneticWrapper>

          {/* Signup Button */}
          <MagneticWrapper>
            <motion.button
              onClick={() => {
                setAuthMode('sign-up');
                setIsAuthModalOpen(true);
              }}
              className="cta-button-secondary w-full sm:w-auto min-w-[200px] bg-white text-google-blue border-2 border-google-blue rounded-full font-semibold text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 cursor-pointer relative overflow-hidden shadow-lg focus:outline-none focus:ring-2 focus:ring-google-blue focus:ring-offset-2 flex items-center justify-center gap-2 group hover:bg-google-blue hover:text-white transition-colors"
              aria-label="Sign up for ProVeloce Meet"
              whileHover={!reducedMotion ? {
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(26, 115, 232, 0.3)'
              } : undefined}
              whileTap={!reducedMotion ? { scale: 0.98 } : undefined}
              transition={{ duration: timing.fast }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Signup
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
          </MagneticWrapper>
        </motion.div>

        {/* Note with fade-in */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: timing.cinematic }}
          className="text-sm sm:text-base text-text-tertiary italic"
        >
          Login/Signup required to access dashboard & meeting features
        </motion.p>
      </div>

      {/* Auth Modal */}
      <AnimatePresence mode="wait">
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(LandingIntro);
