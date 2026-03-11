'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.toLowerCase().includes('network') ||
        this.state.error?.message?.toLowerCase().includes('fetch');

      return (
        <div className="flex items-center justify-center min-h-screen min-h-[100dvh] bg-meeting p-4">
          <div className="text-center text-white max-w-md w-full">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-control-danger/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-control-danger" />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">
              {isNetworkError ? 'Connection Error' : 'Something went wrong'}
            </h2>

            {/* Description */}
            <p className="text-white/60 text-sm sm:text-base mb-6">
              {isNetworkError
                ? 'Unable to connect to the server. Please check your internet connection and try again.'
                : 'We encountered an unexpected error. Please try again or return to the home page.'
              }
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-google-blue hover:bg-google-blue-hover text-white rounded-full font-medium transition-colors touch-target"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-surface hover:bg-control-hover text-white rounded-full font-medium transition-colors touch-target"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Debug info (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-white/40 text-xs cursor-pointer">Error details</summary>
                <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs text-white/50 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
