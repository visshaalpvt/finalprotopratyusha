'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaThumbsUp,
    FaThumbsDown,
    FaHeart,
    FaFire,
    FaSurprise,
    FaLaughSquint,
    FaHandPaper,
} from 'react-icons/fa';
import { timing, easing, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

// Reaction types mapped to React Icons
export const REACTIONS = [
    { id: 'thumbs-up', icon: FaThumbsUp, label: '👍', color: '#4CAF50' },
    { id: 'thumbs-down', icon: FaThumbsDown, label: '👎', color: '#f44336' },
    { id: 'heart', icon: FaHeart, label: '❤️', color: '#e91e63' },
    { id: 'fire', icon: FaFire, label: '🔥', color: '#ff9800' },
    { id: 'surprised', icon: FaSurprise, label: '😮', color: '#ffc107' },
    { id: 'laugh', icon: FaLaughSquint, label: '😂', color: '#ffeb3b' },
] as const;

export type ReactionType = typeof REACTIONS[number]['id'];

interface Reaction {
    id: string;
    type: ReactionType;
    x: number;
    y: number;
    createdAt: number;
}

interface ReactionOverlayProps {
    reactions: Reaction[];
    onReactionComplete: (id: string) => void;
}

interface ReactionButtonProps {
    onReact: (type: ReactionType) => void;
    className?: string;
}

// Floating reaction animation
const FloatingReaction = memo(function FloatingReaction({
    reaction,
    onComplete,
}: {
    reaction: Reaction;
    onComplete: () => void;
}) {
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();
    const reactionData = REACTIONS.find(r => r.id === reaction.type);

    if (!reactionData) return null;

    const Icon = reactionData.icon;

    useEffect(() => {
        const timer = setTimeout(onComplete, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (reducedMotion) {
        return (
            <div
                className="fixed pointer-events-none z-50"
                style={{ left: reaction.x, top: reaction.y }}
            >
                <Icon className="w-10 h-10" style={{ color: reactionData.color }} />
            </div>
        );
    }

    return (
        <motion.div
            className="fixed pointer-events-none z-50"
            style={{ left: reaction.x, top: reaction.y }}
            initial={{
                opacity: 0,
                scale: 0.5,
                y: 0,
            }}
            animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
                y: -120,
            }}
            transition={{
                duration: 2,
                times: [0, 0.1, 0.7, 1],
                ease: easing.smooth,
            }}
        >
            <Icon className="w-10 h-10 drop-shadow-lg" style={{ color: reactionData.color }} />
        </motion.div>
    );
});

// Overlay to display floating reactions
export const ReactionOverlay = memo(function ReactionOverlay({
    reactions,
    onReactionComplete,
}: ReactionOverlayProps) {
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <AnimatePresence>
                {reactions.map((reaction) => (
                    <FloatingReaction
                        key={reaction.id}
                        reaction={reaction}
                        onComplete={() => onReactionComplete(reaction.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
});

// Reaction picker button
export const ReactionButton = memo(function ReactionButton({
    onReact,
    className,
}: ReactionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    const handleReact = useCallback((type: ReactionType) => {
        onReact(type);
        setIsOpen(false);
    }, [onReact]);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;

        const handleClick = (e: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [isOpen]);

    return (
        <div className="relative" ref={buttonRef as any}>
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "control-btn touch-target no-select",
                    isOpen && "bg-google-blue",
                    className
                )}
                whileHover={!reducedMotion ? { scale: 1.05 } : undefined}
                whileTap={!reducedMotion ? { scale: 0.95 } : undefined}
                title="React"
                aria-label="Add reaction"
                aria-expanded={isOpen}
            >
                <FaThumbsUp className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: timing.fast }}
                        className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 p-2 bg-surface rounded-full shadow-2xl"
                    >
                        {REACTIONS.map((reaction) => (
                            <motion.button
                                key={reaction.id}
                                onClick={() => handleReact(reaction.id)}
                                className="p-2 rounded-full hover:bg-control-hover transition-colors"
                                whileHover={!reducedMotion ? { scale: 1.2 } : undefined}
                                whileTap={!reducedMotion ? { scale: 0.9 } : undefined}
                                title={reaction.label}
                                aria-label={`React with ${reaction.label}`}
                            >
                                <reaction.icon
                                    className="w-6 h-6"
                                    style={{ color: reaction.color }}
                                />
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// Hand raise button with glow animation
export const HandRaiseButton = memo(function HandRaiseButton({
    isRaised,
    onToggle,
    className,
}: {
    isRaised: boolean;
    onToggle: () => void;
    className?: string;
}) {
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    return (
        <motion.button
            onClick={onToggle}
            className={cn(
                "control-btn touch-target no-select relative",
                isRaised && "bg-yellow-500 hover:bg-yellow-600",
                className
            )}
            whileHover={!reducedMotion ? { scale: 1.05 } : undefined}
            whileTap={!reducedMotion ? { scale: 0.95 } : undefined}
            title={isRaised ? "Lower hand" : "Raise hand"}
            aria-label={isRaised ? "Lower hand" : "Raise hand"}
            aria-pressed={isRaised}
        >
            <FaHandPaper className="w-5 h-5" />

            {/* Animated glow ring when active */}
            {isRaised && !reducedMotion && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ boxShadow: '0 0 0 0 rgba(234, 179, 8, 0.4)' }}
                    animate={{
                        boxShadow: [
                            '0 0 0 0 rgba(234, 179, 8, 0.4)',
                            '0 0 0 8px rgba(234, 179, 8, 0)',
                        ]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            )}
        </motion.button>
    );
});

// Hook to manage reactions state
export function useReactions() {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    const addReaction = useCallback((type: ReactionType, x?: number, y?: number) => {
        const id = `${Date.now()}-${Math.random()}`;
        const reaction: Reaction = {
            id,
            type,
            x: x ?? window.innerWidth / 2 - 20,
            y: y ?? window.innerHeight - 200,
            createdAt: Date.now(),
        };

        setReactions(prev => [...prev, reaction]);
        return id;
    }, []);

    const removeReaction = useCallback((id: string) => {
        setReactions(prev => prev.filter(r => r.id !== id));
    }, []);

    return { reactions, addReaction, removeReaction };
}

export default ReactionButton;
