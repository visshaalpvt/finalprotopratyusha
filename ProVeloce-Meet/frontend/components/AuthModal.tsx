'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SignIn, SignUp, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'sign-in' | 'sign-up';
}

const AuthModal = ({ isOpen, onClose, initialMode = 'sign-in' }: AuthModalProps) => {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode);
  const router = useRouter();
  const { isSignedIn } = useUser();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Update mode when initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  // Redirect to home after successful authentication
  useEffect(() => {
    if (isSignedIn && isOpen) {
      router.push('/home');
      onClose();
    }
  }, [isSignedIn, isOpen, router, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () => {
      return Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(focusableSelectors) || []
      ).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    };

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocus = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab
        if (currentFocus === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (currentFocus === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    // Focus first element after a short delay to ensure modal is fully rendered
    setTimeout(() => {
      firstElement?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, mode]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-light-4">
            <div className="flex items-center gap-3">
              <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-bold text-text-primary">
                {mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('sign-in')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === 'sign-in'
                      ? 'bg-google-blue text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-light-2'
                  }`}
                  aria-label="Switch to sign in"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('sign-up')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === 'sign-up'
                      ? 'bg-google-blue text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-light-2'
                  }`}
                  aria-label="Switch to sign up"
                >
                  Sign Up
                </button>
              </div>
            </div>
            <Button
              ref={firstFocusableRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-light-2"
              aria-label="Close authentication modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'sign-in' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'sign-in' ? 20 : -20 }}
                transition={{ duration: 0.2 }}
              >
                {mode === 'sign-in' ? (
                  <SignIn
                    routing="hash"
                    afterSignInUrl="/home"
                    appearance={{
                      elements: {
                        rootBox: 'mx-auto',
                        card: 'shadow-none border-0 bg-transparent',
                        headerTitle: 'hidden',
                        headerSubtitle: 'hidden',
                        socialButtonsBlockButton: 'border border-light-4 hover:bg-light-2',
                        formButtonPrimary: 'bg-google-blue hover:bg-google-blue-dark',
                        footerActionLink: 'text-google-blue hover:text-google-blue-dark',
                      },
                    }}
                  />
                ) : (
                  <SignUp
                    routing="hash"
                    afterSignUpUrl="/home"
                    appearance={{
                      elements: {
                        rootBox: 'mx-auto',
                        card: 'shadow-none border-0 bg-transparent',
                        headerTitle: 'hidden',
                        headerSubtitle: 'hidden',
                        socialButtonsBlockButton: 'border border-light-4 hover:bg-light-2',
                        formButtonPrimary: 'bg-google-blue hover:bg-google-blue-dark',
                        footerActionLink: 'text-google-blue hover:text-google-blue-dark',
                      },
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;

