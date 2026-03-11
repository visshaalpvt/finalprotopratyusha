'use client';

import { cn } from '@/lib/utils';
import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { timing, easing, prefersReducedMotion } from '@/lib/motion';
import { SpotlightCard } from './motion/AdvancedMotion';

interface HomeCardProps {
  className?: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  handleClick?: () => void;
  variant?: 'primary' | 'secondary';
  index?: number;
}

const HomeCard = memo(forwardRef<HTMLDivElement, HomeCardProps>(
  function HomeCard({
    className,
    icon,
    title,
    description,
    handleClick,
    variant = 'secondary',
    index = 0,
  }, ref) {
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    // If reduced motion, render simple button without spotlight
    if (reducedMotion) {
      return (
        <button
          className={cn(
            "flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 rounded-xl text-left transition-all touch-target no-select",
            "active:scale-[0.98]",
            variant === 'primary'
              ? "bg-google-blue text-white hover:bg-google-blue-hover shadow-md"
              : "bg-white border border-border-lighter hover:bg-bg-tertiary hover:shadow-sm text-text-primary",
            className
          )}
          onClick={handleClick}
        >
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0",
            variant === 'primary' ? "bg-white/20" : "bg-bg-tertiary"
          )}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base truncate">{title}</h3>
            {description && (
              <p className={cn(
                "text-xs sm:text-sm mt-0.5 truncate",
                variant === 'primary' ? "text-white/70" : "text-text-secondary"
              )}>
                {description}
              </p>
            )}
          </div>
        </button>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: timing.normal,
          delay: index * 0.08,
          ease: easing.smooth
        }}
        className="h-full"
      >
        <SpotlightCard
          className={cn(
            "h-full cursor-pointer transition-colors",
            variant === 'primary' ? "bg-google-blue border-transparent" : "bg-white",
            className
          )}
          spotlightColor={variant === 'primary' ? "rgba(255, 255, 255, 0.15)" : "rgba(26, 115, 232, 0.1)"}
          onClick={handleClick}
        >
          <div className={cn(
            "flex items-center gap-3 sm:gap-4 w-full p-3 sm:p-4 h-full",
            variant === 'primary' ? "text-white" : "text-text-primary"
          )}>
            <motion.div
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0",
                variant === 'primary' ? "bg-white/20" : "bg-bg-tertiary"
              )}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: timing.fast }}
            >
              {icon}
            </motion.div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm sm:text-base truncate">{title}</h3>
              {description && (
                <p className={cn(
                  "text-xs sm:text-sm mt-0.5 truncate",
                  variant === 'primary' ? "text-white/70" : "text-text-secondary"
                )}>
                  {description}
                </p>
              )}
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    );
  }
));

export default HomeCard;
