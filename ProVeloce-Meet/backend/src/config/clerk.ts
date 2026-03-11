import { createClerkClient, verifyToken as clerkVerifyToken } from '@clerk/backend';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

// ============================================
// JWKS CACHE CONFIGURATION
// ============================================
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const JWKS_RETRY_DELAY_MS = 1000;
const MAX_JWKS_RETRIES = 3;

interface JWKSCache {
  jwks: ReturnType<typeof createRemoteJWKSet> | null;
  lastFetched: number;
  issuer: string;
}

let jwksCache: JWKSCache = {
  jwks: null,
  lastFetched: 0,
  issuer: '',
};

// Get JWKS with caching
const getJWKS = async (): Promise<ReturnType<typeof createRemoteJWKSet>> => {
  const now = Date.now();
  const issuer = process.env.CLERK_ISSUER_URL || `https://${process.env.CLERK_DOMAIN || 'clerk.proveloce.com'}`;

  // Return cached JWKS if still valid
  if (jwksCache.jwks && jwksCache.issuer === issuer && (now - jwksCache.lastFetched) < JWKS_CACHE_TTL_MS) {
    return jwksCache.jwks;
  }

  // Fetch new JWKS
  const jwksUrl = `${issuer}/.well-known/jwks.json`;
  const jwks = createRemoteJWKSet(new URL(jwksUrl));

  // Update cache
  jwksCache = {
    jwks,
    lastFetched: now,
    issuer,
  };

  console.log('[Clerk] JWKS cache refreshed');
  return jwks;
};

// ============================================
// CLERK CLIENT (Lazy Initialization)
// ============================================
let _clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient() {
  if (!_clerkClient) {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY is not set in environment variables.');
    }
    _clerkClient = createClerkClient({ secretKey });
  }
  return _clerkClient;
}

// Export clerkClient with proper method forwarding
const clerkClientProxy = {
  get users() {
    return getClerkClient().users;
  },
  get telemetry() {
    return getClerkClient().telemetry;
  },
};

// ============================================
// JWT V2 TOKEN VERIFICATION
// ============================================
interface VerifyTokenOptions {
  audience?: string;
  issuer?: string;
  clockTolerance?: number;
}

interface VerifiedToken extends JWTPayload {
  sub: string;
  azp?: string;
  sid?: string;
}

/**
 * Verify Clerk JWT token with full validation
 * Supports JWT v2 format with JWKS caching
 */
export const verifyToken = async (
  token: string,
  options: VerifyTokenOptions = {}
): Promise<VerifiedToken> => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not set');
  }

  const issuer = options.issuer ||
    process.env.CLERK_ISSUER_URL ||
    `https://${process.env.CLERK_DOMAIN || 'clerk.proveloce.com'}`;

  const audience = options.audience || process.env.CLERK_AUDIENCE;
  const clockTolerance = options.clockTolerance || 60; // 60 seconds tolerance

  try {
    // Try Clerk SDK verification first (handles most cases)
    const decoded = await clerkVerifyToken(token, {
      secretKey,
      authorizedParties: audience ? [audience] : undefined,
      clockSkewInMs: clockTolerance * 1000,
    });

    if (!decoded || !decoded.sub) {
      throw new Error('Token verification failed: No subject found');
    }

    return decoded as VerifiedToken;
  } catch (clerkError: any) {
    // If Clerk SDK fails, try jose with JWKS
    console.warn('[Clerk] SDK verification failed, trying JWKS:', clerkError.message);

    try {
      const jwks = await getJWKS();
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience,
        clockTolerance,
      });

      if (!payload.sub) {
        throw new Error('Token verification failed: No subject found');
      }

      return payload as VerifiedToken;
    } catch (joseError: any) {
      console.error('[Clerk] JWKS verification also failed:', joseError.message);
      throw clerkError; // Throw original Clerk error
    }
  }
};

// ============================================
// REFRESH TOKEN UTILITIES
// ============================================

/**
 * Check if token is expiring soon (within buffer)
 */
export const isTokenExpiringSoon = (token: string, bufferSeconds = 300): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    const exp = payload.exp;

    if (!exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return (exp - now) <= bufferSeconds;
  } catch {
    return true;
  }
};

/**
 * Get token expiry time in seconds
 */
export const getTokenExpiry = (token: string): number => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return payload.exp || 0;
  } catch {
    return 0;
  }
};

// Type assertion for proxy
export const clerkClient = clerkClientProxy as unknown as ReturnType<typeof createClerkClient>;
