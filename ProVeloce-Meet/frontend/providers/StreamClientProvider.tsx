'use client';

import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useUser, useAuth } from '@clerk/nextjs';

import { apiClient } from '@/lib/api-client';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// Token refresh configuration
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Validate Stream API key
if (typeof window !== 'undefined' && !API_KEY) {
  console.error('NEXT_PUBLIC_STREAM_API_KEY is not set. Video features will not work.');
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const retryCountRef = useRef(0);
  const tokenCacheRef = useRef<TokenCache | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Parse JWT to get expiration time
  const getTokenExpiry = useCallback((token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp || 0) * 1000; // Convert to milliseconds
    } catch {
      return Date.now() + 60 * 60 * 1000; // Default 1 hour
    }
  }, []);

  // Validate JWT format
  const isValidJWT = useCallback((token: string | null | undefined): token is string => {
    if (!token || typeof token !== 'string') return false;
    return token.split('.').length === 3;
  }, []);

  // Fetch fresh Clerk token with fallback
  const getFreshClerkToken = useCallback(async (): Promise<string | null> => {
    // Try with "meet" template first
    let token = await getToken({ template: "meet" });
    if (isValidJWT(token)) return token;

    // Fallback: try without template
    console.warn('Token with "meet" template failed, trying without template...');
    token = await getToken();
    if (isValidJWT(token)) return token;

    console.error('Failed to get valid Clerk token');
    return null;
  }, [getToken, isValidJWT]);

  // Fetch Stream token from backend
  const fetchStreamToken = useCallback(async (clerkToken: string): Promise<string> => {
    const response = await apiClient.post<{ token: string }>(
      '/stream/token',
      {},
      clerkToken
    );

    if (!response?.token || typeof response.token !== 'string') {
      throw new Error('Invalid token response from backend');
    }

    return response.token;
  }, []);

  // Main token provider with caching and proactive refresh
  const tokenProvider = useCallback(async (): Promise<string> => {
    // Return cached token if still valid
    if (tokenCacheRef.current) {
      const timeUntilExpiry = tokenCacheRef.current.expiresAt - Date.now();
      if (timeUntilExpiry > TOKEN_REFRESH_BUFFER_MS) {
        return tokenCacheRef.current.token;
      }
    }

    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      // Wait for current refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      if (tokenCacheRef.current) {
        return tokenCacheRef.current.token;
      }
    }

    isRefreshingRef.current = true;

    try {
      // Prevent infinite retry loops
      if (retryCountRef.current >= MAX_RETRIES) {
        const errorMessage = `Failed to fetch Stream token after ${MAX_RETRIES} attempts. Please refresh the page.`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      retryCountRef.current++;

      // Get fresh Clerk token
      const clerkToken = await getFreshClerkToken();
      if (!clerkToken) {
        throw new Error('Failed to get authentication token. Please sign in again.');
      }

      // Fetch Stream token from backend
      const streamToken = await fetchStreamToken(clerkToken);

      // Cache the token
      const expiresAt = getTokenExpiry(streamToken);
      tokenCacheRef.current = { token: streamToken, expiresAt };

      // Schedule proactive refresh
      const timeUntilRefresh = expiresAt - Date.now() - TOKEN_REFRESH_BUFFER_MS;
      if (timeUntilRefresh > 0) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          // Proactively refresh before expiry
          tokenProvider().catch(console.error);
        }, timeUntilRefresh);
      }

      // Reset retry count on success
      retryCountRef.current = 0;
      return streamToken;

    } catch (error: any) {
      // Handle 401 errors specially
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        setError('Authentication failed. Please sign in again.');
        retryCountRef.current = 0; // Allow retry after re-auth
        throw error;
      }

      console.error('Error fetching Stream token:', {
        message: error?.message,
        retryCount: retryCountRef.current,
      });

      // Retry with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, retryCountRef.current - 1))
        );
        return tokenProvider();
      }

      setError(`Failed to fetch Stream token: ${error?.message || 'Unknown error'}`);
      throw error;

    } finally {
      isRefreshingRef.current = false;
    }
  }, [getFreshClerkToken, fetchStreamToken, getTokenExpiry]);

  // Get user display name
  const getUserDisplayName = useCallback(() => {
    if (user?.firstName) {
      return user.lastName
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName;
    }
    return user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';
  }, [user]);

  // Initialize client
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) {
      setError('Stream API key is missing. Please configure NEXT_PUBLIC_STREAM_API_KEY.');
      return;
    }

    let mounted = true;

    const initializeClient = async () => {
      try {
        // Verify we can get a token before initializing
        const initialToken = await getFreshClerkToken();
        if (!initialToken) {
          if (mounted) setError('Unable to authenticate. Please sign in again.');
          return;
        }

        const client = new StreamVideoClient({
          apiKey: API_KEY,
          user: {
            id: user.id,
            name: getUserDisplayName(),
            image: user.imageUrl,
          },
          tokenProvider,
        });

        if (mounted) {
          setVideoClient(client);
          setError(null);
          retryCountRef.current = 0;
        }
      } catch (err: any) {
        console.error('Error initializing Stream client:', err);
        if (mounted) {
          setError(err?.message || 'Failed to initialize video client');
          retryCountRef.current = 0;
        }
      }
    };

    initializeClient();

    return () => {
      mounted = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [user, isLoaded, getFreshClerkToken, getUserDisplayName, tokenProvider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (videoClient) {
        videoClient.disconnectUser();
      }
    };
  }, [videoClient]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-secondary">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">Connection Error</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-google-blue text-white rounded-full hover:bg-google-blue-hover transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
