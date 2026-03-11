import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Lazy-loaded Clerk domain and JWKS client
let _clerkDomain: string | null = null;
let _jwks: ReturnType<typeof jwksClient> | null = null;

// Extract Clerk domain/issuer from environment variables
function getClerkDomain(): string {
  if (_clerkDomain) {
    return _clerkDomain;
  }

  // Priority 1: Use CLERK_JWT_ISSUER if explicitly set (for custom domains)
  if (process.env.CLERK_JWT_ISSUER) {
    _clerkDomain = process.env.CLERK_JWT_ISSUER.startsWith('http') 
      ? process.env.CLERK_JWT_ISSUER 
      : `https://${process.env.CLERK_JWT_ISSUER}`;
    return _clerkDomain;
  }

  // Priority 2: Use CLERK_DOMAIN if set
  if (process.env.CLERK_DOMAIN) {
    _clerkDomain = process.env.CLERK_DOMAIN.startsWith('http') 
      ? process.env.CLERK_DOMAIN 
      : `https://${process.env.CLERK_DOMAIN}`;
    return _clerkDomain;
  }
  
  // Priority 3: Extract from publishable key if available
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  if (publishableKey && publishableKey.startsWith('pk_')) {
    try {
      const parts = publishableKey.split('_');
      if (parts.length >= 3) {
        const decoded = Buffer.from(parts[2], 'base64').toString().replace(/\0/g, '').trim();
        // Remove any trailing null characters or special chars
        const domain = decoded.split('\0')[0].trim();
        _clerkDomain = domain.startsWith('http') ? domain : `https://${domain}`;
        return _clerkDomain;
      }
    } catch (e) {
      console.warn('Could not extract Clerk domain from publishable key:', e);
    }
  }
  
  // No fallback for production - domain must be explicitly set
  throw new Error('CLERK_JWT_ISSUER, CLERK_DOMAIN, or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be set in environment variables');
}

// Get JWKS URL
function getJwksUrl(): string {
  // Priority 1: Use CLERK_JWKS_ENDPOINT if explicitly set
  if (process.env.CLERK_JWKS_ENDPOINT) {
    return process.env.CLERK_JWKS_ENDPOINT;
  }
  
  // Priority 2: Construct from domain
  const clerkDomain = getClerkDomain();
  return `${clerkDomain}/.well-known/jwks.json`;
}

// Get JWKS client (lazy-loaded)
function getJwksClient() {
  if (!_jwks) {
    const jwksUrl = getJwksUrl();
    
    console.log('Initializing JWKS client:', {
      jwksUrl,
      issuer: getClerkDomain(),
      audience: process.env.CLERK_JWT_AUDIENCE || 'not set',
    });
    
    _jwks = jwksClient({
      jwksUri: jwksUrl,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return _jwks;
}

// Get signing key from JWKS
function getKey(header: any, callback: any) {
  const jwks = getJwksClient();
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Verify Clerk JWT token using jsonwebtoken
export function verifyClerkToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const clerkDomain = getClerkDomain();
    
    // Build verification options
    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['RS256'],
      issuer: clerkDomain,
    };
    
    // Add audience verification if CLERK_JWT_AUDIENCE is set
    if (process.env.CLERK_JWT_AUDIENCE) {
      verifyOptions.audience = process.env.CLERK_JWT_AUDIENCE;
    }
    
    // Decode token without verification first to see what's in it (for debugging)
    let decodedUnverified: any = null;
    try {
      decodedUnverified = jwt.decode(token, { complete: true });
    } catch (e) {
      // Ignore decode errors
    }
    
    jwt.verify(
      token,
      getKey,
      verifyOptions,
      (err, decoded) => {
        if (err) {
          // Enhanced error logging
          console.error('JWT Verification Error:', {
            errorName: err.name,
            errorMessage: err.message,
            expectedIssuer: clerkDomain,
            expectedAudience: process.env.CLERK_JWT_AUDIENCE || 'not set',
            tokenIssuer: decodedUnverified?.payload?.iss,
            tokenAudience: decodedUnverified?.payload?.aud,
            tokenExpiry: decodedUnverified?.payload?.exp 
              ? new Date(decodedUnverified.payload.exp * 1000).toISOString() 
              : 'not set',
            tokenAlgorithm: decodedUnverified?.header?.alg,
            tokenKid: decodedUnverified?.header?.kid,
          });
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

