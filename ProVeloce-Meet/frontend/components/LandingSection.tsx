'use client';

import { Video, Shield, Users, Clock } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeInUp, fadeInLeft, fadeInRight } from '@/lib/animations';

const LandingSection = () => {
  const features = [
    {
      icon: Video,
      title: 'Instant Meetings',
      description: 'Start or join meetings instantly with a single click',
    },
    {
      icon: Shield,
      title: 'Secure Rooms',
      description: 'End-to-end encrypted video calls for your privacy',
    },
    {
      icon: Users,
      title: 'Collaborate',
      description: 'Work together with screen sharing and real-time chat',
    },
    {
      icon: Clock,
      title: 'Record & Review',
      description: 'Record meetings and access history anytime',
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-gradient-to-br from-light-2 via-white to-light-2">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-12 sm:mb-16"
        >
          {/* Logo and App Name */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6"
          >
            <div className="logo-gradient-wrapper">
              <Image
                src="/icons/ProMeet.png"
                alt="ProVeloce Meet Logo"
                width={56}
                height={56}
                className="logo-gradient h-12 w-12 sm:h-14 sm:w-14 rounded-lg"
              />
            </div>
            <h1 className="gradient-text text-4xl sm:text-5xl lg:text-6xl font-extrabold">
              ProVeloce Meet
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-primary mb-4 sm:mb-6"
          >
            Meet anyone, anywhere — with seamless video collaboration
          </motion.p>

          {/* Description */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto space-y-2 sm:space-y-3"
          >
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Professional video conferencing platform designed for modern teams. Host secure online meetings with real-time collaboration, instant messaging, and meeting recording.
            </p>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Start instant meetings, schedule sessions, or create personal rooms — all with enterprise-grade security and crystal-clear video quality.
            </p>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial="hidden"
                animate="visible"
                variants={index % 2 === 0 ? fadeInLeft : fadeInRight}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white border border-light-4 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-google-blue/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-google-blue/10 rounded-lg">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-google-blue" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-text-secondary">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm sm:text-base text-text-secondary mb-4">
            Ready to get started? Sign up or sign in to begin your first meeting.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingSection;

