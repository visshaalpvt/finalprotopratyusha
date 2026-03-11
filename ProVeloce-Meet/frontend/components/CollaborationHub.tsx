'use client';

import { memo, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiEdit3, FiLayout, FiX, FiChevronUp } from 'react-icons/fi';
import { timing, easing, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

type CollabTab = 'chat' | 'notes' | 'whiteboard';

interface CollaborationHubProps {
    meetingId: string;
    chatComponent?: ReactNode;
    className?: string;
}

const TABS = [
    { id: 'chat' as const, icon: FiMessageSquare, label: 'Chat' },
    { id: 'notes' as const, icon: FiEdit3, label: 'Notes' },
    { id: 'whiteboard' as const, icon: FiLayout, label: 'Board' },
];

// Panel animation variants
const panelVariants = {
    collapsed: {
        height: 56,
        width: 200,
        borderRadius: 28,
    },
    expanded: {
        height: 480,
        width: 360,
        borderRadius: 16,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        }
    },
};

const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: timing.normal, ease: easing.smooth }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: timing.fast }
    },
};

// Mobile bottom sheet variants
const mobileVariants = {
    collapsed: {
        y: 'calc(100% - 60px)',
    },
    expanded: {
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
        }
    },
};

/**
 * CollaborationHub - Expandable panel for Notes, Whiteboard, Chat
 * Desktop: Bottom-right floating panel
 * Mobile: Slide-up bottom sheet
 */
const CollaborationHub = memo(function CollaborationHub({
    meetingId,
    chatComponent,
    className,
}: CollaborationHubProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<CollabTab>('chat');
    const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

    const handleTabChange = useCallback((tab: CollabTab) => {
        setActiveTab(tab);
        if (!isExpanded) setIsExpanded(true);
    }, [isExpanded]);

    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    // Desktop version
    const DesktopPanel = (
        <motion.div
            className={cn(
                "fixed bottom-24 right-4 z-40 hidden sm:block",
                "bg-surface/95 backdrop-blur-xl border border-white/10",
                "shadow-2xl overflow-hidden",
                className
            )}
            variants={panelVariants}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 45, 0.95), rgba(20, 20, 35, 0.98))',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
        >
            {/* Header / Tab Bar */}
            <div className="flex items-center justify-between h-14 px-3 border-b border-white/10">
                <div className="flex gap-1">
                    {TABS.map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                                activeTab === tab.id
                                    ? "bg-google-blue text-white"
                                    : "text-white/70 hover:text-white hover:bg-white/10"
                            )}
                            whileHover={!reducedMotion ? { scale: 1.02 } : undefined}
                            whileTap={!reducedMotion ? { scale: 0.98 } : undefined}
                        >
                            <tab.icon className="w-4 h-4" />
                            {isExpanded && <span className="text-sm">{tab.label}</span>}
                        </motion.button>
                    ))}
                </div>

                <motion.button
                    onClick={toggleExpand}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    whileHover={!reducedMotion ? { scale: 1.1 } : undefined}
                    whileTap={!reducedMotion ? { scale: 0.9 } : undefined}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                    {isExpanded ? <FiX className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />}
                </motion.button>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {isExpanded && (
                    <motion.div
                        key={activeTab}
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="h-[calc(100%-56px)] overflow-hidden"
                    >
                        {activeTab === 'chat' && (
                            <div className="h-full">
                                {chatComponent || (
                                    <div className="flex items-center justify-center h-full text-white/50">
                                        <p>Chat will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="p-4 h-full">
                                <div className="h-full rounded-lg bg-white/5 border border-white/10 p-4">
                                    <p className="text-white/50 text-sm">
                                        📝 Collaborative notes coming soon...
                                    </p>
                                    <p className="text-white/30 text-xs mt-2">
                                        Real-time editing with multi-cursor support
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'whiteboard' && (
                            <div className="p-4 h-full">
                                <div className="h-full rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-white/50 text-sm">🎨 Whiteboard coming soon...</p>
                                        <p className="text-white/30 text-xs mt-2">Powered by tldraw</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    // Mobile version (bottom sheet)
    const MobilePanel = (
        <motion.div
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 sm:hidden",
                "bg-surface/98 backdrop-blur-xl border-t border-white/10",
                "rounded-t-2xl shadow-2xl",
                className
            )}
            style={{ height: '60vh' }}
            variants={mobileVariants}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
        >
            {/* Drag handle */}
            <button
                onClick={toggleExpand}
                className="w-full py-3 flex justify-center"
                aria-label={isExpanded ? "Collapse" : "Expand"}
            >
                <div className="w-10 h-1 rounded-full bg-white/30" />
            </button>

            {/* Tab Bar */}
            <div className="flex items-center justify-center gap-2 px-4 pb-3 border-b border-white/10">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                            activeTab === tab.id
                                ? "bg-google-blue text-white"
                                : "text-white/70 hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="h-[calc(100%-100px)] overflow-auto">
                {activeTab === 'chat' && chatComponent}
                {activeTab === 'notes' && (
                    <div className="p-4 text-center text-white/50">
                        Notes coming soon...
                    </div>
                )}
                {activeTab === 'whiteboard' && (
                    <div className="p-4 text-center text-white/50">
                        Whiteboard coming soon...
                    </div>
                )}
            </div>
        </motion.div>
    );

    return (
        <>
            {DesktopPanel}
            {MobilePanel}
        </>
    );
});

export default CollaborationHub;
