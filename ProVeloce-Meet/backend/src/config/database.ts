import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Retry connection with exponential backoff
async function connectWithRetry(
  uri: string,
  opts: mongoose.ConnectOptions,
  dbName: string,
  maxRetries: number = 5,
  retryDelay: number = 2000
): Promise<typeof mongoose> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mongooseInstance = await mongoose.connect(uri, opts);
      console.log(`✅ MongoDB connected successfully to database: ${dbName}`);
      return mongooseInstance;
    } catch (error: any) {
      lastError = error;
      const sanitizedUri = uri.replace(/:[^:@]+@/, ':****@');
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(
          `⚠️  MongoDB connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`
        );
        console.warn(`   Error: ${error.message}`);
        console.warn(`   URI: ${sanitizedUri}`);
        
        // Provide helpful error messages
        if (error.message?.includes('whitelist') || error.message?.includes('IP')) {
          console.warn(
            `   💡 Tip: Make sure your IP address is whitelisted in MongoDB Atlas:`,
            `   https://www.mongodb.com/docs/atlas/security-whitelist/`
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`❌ MongoDB connection failed after ${maxRetries} attempts.`);
        console.error(`   Final error: ${error.message}`);
        console.error(`   URI: ${sanitizedUri}`);
        
        // Provide detailed error information
        if (error.message?.includes('whitelist') || error.message?.includes('IP')) {
          console.error(
            `   💡 Solution: Add your IP address to MongoDB Atlas IP Access List:`,
            `   https://www.mongodb.com/docs/atlas/security-whitelist/`
          );
        } else if (error.message?.includes('authentication')) {
          console.error(
            `   💡 Solution: Check your MongoDB username and password in MONGO_URI`
          );
        } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')) {
          console.error(
            `   💡 Solution: Check your MongoDB hostname in MONGO_URI`
          );
        }
        
        throw error;
      }
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('MongoDB connection failed');
}

async function connectDB(): Promise<typeof mongoose> {
  let MONGO_URI = process.env.MONGO_URI || '';

  if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable inside .env');
  }

  // Ensure the database name is 'proveloce-meet'
  const DB_NAME = 'proveloce-meet';
  
  // Parse and update the MongoDB URI to include the database name
  // Handle both formats: mongodb:// and mongodb+srv://
  MONGO_URI = MONGO_URI.trim();
  
  // Find the position where we need to insert the database name
  // MongoDB URI format: mongodb+srv://[username:password@]hostname[:port][/database][?options]
  // We need to find the position after the hostname (after the last @ or after ://)
  
  // Find the position after the hostname
  // For mongodb+srv://, the hostname comes after the last @
  // For mongodb://, it could be after @ or after ://
  const atIndex = MONGO_URI.lastIndexOf('@');
  const protocolIndex = MONGO_URI.indexOf('://');
  
  // Determine where the hostname ends
  let hostEndIndex: number;
  if (atIndex !== -1) {
    // Has credentials, hostname starts after @
    hostEndIndex = atIndex + 1;
  } else if (protocolIndex !== -1) {
    // No credentials, hostname starts after ://
    hostEndIndex = protocolIndex + 3;
  } else {
    // Invalid URI format, but try to proceed
    hostEndIndex = 0;
  }
  
  // Find the first / or ? after the hostname
  const slashIndex = MONGO_URI.indexOf('/', hostEndIndex);
  const queryIndex = MONGO_URI.indexOf('?', hostEndIndex);
  
  // Check if there's already a database name in the path
  let hasDatabaseName = false;
  if (slashIndex !== -1 && (queryIndex === -1 || slashIndex < queryIndex)) {
    // There's a / after hostname, check if it's followed by a database name
    const pathEnd = queryIndex !== -1 ? queryIndex : MONGO_URI.length;
    const pathAfterSlash = MONGO_URI.slice(slashIndex + 1, pathEnd);
    // If there's content after / and before ? or end, it's likely a database name
    if (pathAfterSlash && !pathAfterSlash.includes('/')) {
      hasDatabaseName = true;
    }
  }
  
  if (hasDatabaseName) {
    // Replace existing database name
    // Match /databaseName followed by ? or end of string
    const dbNamePattern = /\/([^/?]+)(\?|$)/;
    MONGO_URI = MONGO_URI.replace(dbNamePattern, `/${DB_NAME}$2`);
  } else {
    // No database name exists, add it
    if (queryIndex !== -1) {
      // Has query string, insert database name before it
      MONGO_URI = MONGO_URI.slice(0, queryIndex) + `/${DB_NAME}` + MONGO_URI.slice(queryIndex);
    } else {
      // No query string, append database name
      // Remove any trailing slash first
      const cleanedUri = MONGO_URI.replace(/\/+$/, '');
      MONGO_URI = cleanedUri + `/${DB_NAME}`;
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Validate URI format before connecting
    if (!MONGO_URI.match(/^mongodb(\+srv)?:\/\//)) {
      throw new Error(`Invalid MongoDB URI format: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
    }
    
    const opts = {
      bufferCommands: false,
      dbName: DB_NAME, // Explicitly set database name
      serverSelectionTimeoutMS: 10000, // How long to try selecting a server
      connectTimeoutMS: 10000, // How long to wait for initial connection
      socketTimeoutMS: 45000, // How long to wait for socket operations
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 1, // Minimum number of connections in the pool
      retryWrites: true, // Enable retryable writes
      retryReads: true, // Enable retryable reads
    };

    // Retry connection with exponential backoff
    cached.promise = connectWithRetry(MONGO_URI, opts, DB_NAME);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
