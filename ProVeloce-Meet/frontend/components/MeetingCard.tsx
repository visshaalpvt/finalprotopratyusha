"use client";

import Image from "next/image";
import { memo, useCallback, forwardRef } from "react";
import { motion } from "framer-motion";
import { Copy, Play, Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { timing, easing, prefersReducedMotion } from "@/lib/motion";
import { SpotlightCard, MagneticWrapper } from "./motion/AdvancedMotion";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  index?: number;
}

const MeetingCard = memo(forwardRef<HTMLDivElement, MeetingCardProps>(
  function MeetingCard({
    icon,
    title,
    date,
    isPreviousMeeting,
    buttonIcon1,
    handleClick,
    link,
    buttonText,
    index = 0,
  }, ref) {
    const { toast } = useToast();
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    const copyLink = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
      });
    }, [link, toast]);

    // Content renderer to avoid duplication
    const CardContent = () => (
      <div className="flex flex-col justify-between w-full p-4 sm:p-5 h-full">
        {/* Header */}
        <article className="flex items-start gap-3 mb-4">
          <motion.div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-google-blue-light flex items-center justify-center flex-shrink-0"
            whileHover={!reducedMotion ? {
              scale: 1.1,
              backgroundColor: 'rgba(26, 115, 232, 0.2)',
              transition: { duration: timing.fast }
            } : undefined}
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-google-blue" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-text-primary truncate">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              {date}
            </p>
          </div>
        </article>

        {/* Actions */}
        {!isPreviousMeeting && (
          <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-4 border-t border-border-lighter relative z-10">
            <div className="flex-1">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="w-full h-11 rounded-full touch-target bg-google-blue hover:bg-google-blue-hover shadow-sm hover:shadow-md transition-all"
              >
                {buttonText === 'Play' ? (
                  <Play className="w-4 h-4 mr-2" />
                ) : buttonIcon1 && (
                  <Image src={buttonIcon1} alt="" width={18} height={18} className="brightness-0 invert mr-2" />
                )}
                {buttonText}
              </Button>
            </div>
            <div className="flex-1 sm:flex-none">
              <Button
                onClick={copyLink}
                variant="outline"
                className="w-full h-11 rounded-full touch-target hover:bg-bg-tertiary transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        )}

        {isPreviousMeeting && (
          <motion.div
            className="flex items-center gap-2 mt-auto pt-4 border-t border-border-lighter text-text-tertiary text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span>Ended</span>
          </motion.div>
        )}
      </div>
    );

    if (reducedMotion) {
      return (
        <div className="flex flex-col justify-between w-full rounded-xl bg-white border border-border-lighter hover:shadow-md transition-all">
          <CardContent />
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: timing.normal,
          delay: index * 0.05,
          ease: easing.smooth
        }}
        className="h-full"
      >
        <SpotlightCard className="h-full">
          <CardContent />
        </SpotlightCard>
      </motion.div>
    );
  }
));

export default MeetingCard;
