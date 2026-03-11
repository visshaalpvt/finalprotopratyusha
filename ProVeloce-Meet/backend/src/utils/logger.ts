/**
 * Structured Logger with Rate Limiting
 * Prevents log flooding during high-traffic scenarios
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    count: number;
    firstSeen: number;
    lastSeen: number;
    data?: any;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_LOGS_PER_WINDOW = 100;
const DUPLICATE_SUPPRESSION_MS = 5_000; // Suppress same message for 5 seconds

// In-memory log tracking
const logBuffer: Map<string, LogEntry> = new Map();
let logCountInWindow = 0;
let windowStartTime = Date.now();

// Generate log key for deduplication
function getLogKey(level: LogLevel, message: string): string {
    return `${level}:${message.substring(0, 100)}`;
}

// Check and reset rate limit window
function checkRateLimit(): boolean {
    const now = Date.now();
    if (now - windowStartTime > RATE_LIMIT_WINDOW_MS) {
        windowStartTime = now;
        logCountInWindow = 0;
    }
    return logCountInWindow < MAX_LOGS_PER_WINDOW;
}

// Format log message with metadata
function formatLog(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

// Core logging function with rate limiting
function log(level: LogLevel, message: string, data?: any): void {
    const now = Date.now();
    const key = getLogKey(level, message);

    // Check for duplicate suppression
    const existing = logBuffer.get(key);
    if (existing && (now - existing.lastSeen) < DUPLICATE_SUPPRESSION_MS) {
        existing.count++;
        existing.lastSeen = now;
        return;
    }

    // Rate limit check
    if (!checkRateLimit()) {
        // Log rate limit warning once
        if (logCountInWindow === MAX_LOGS_PER_WINDOW) {
            console.warn('[Logger] Rate limit reached, suppressing logs');
        }
        return;
    }

    // Print suppressed count if any
    if (existing && existing.count > 1) {
        console.log(`[${level.toUpperCase()}] ↑ Repeated ${existing.count} times`);
    }

    // Log the message
    logCountInWindow++;
    logBuffer.set(key, {
        level,
        message,
        count: 1,
        firstSeen: now,
        lastSeen: now,
        data,
    });

    const formatted = formatLog(level, message, data);

    switch (level) {
        case 'debug':
            if (process.env.NODE_ENV === 'development') {
                console.debug(formatted);
            }
            break;
        case 'info':
            console.log(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'error':
            console.error(formatted);
            break;
    }
}

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of logBuffer.entries()) {
        if (now - entry.lastSeen > RATE_LIMIT_WINDOW_MS) {
            logBuffer.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);

// Export logger interface
export const logger = {
    debug: (message: string, data?: any) => log('debug', message, data),
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data),

    // Get current stats
    getStats: () => ({
        logCountInWindow,
        bufferSize: logBuffer.size,
        windowStart: new Date(windowStartTime).toISOString(),
    }),
};

export default logger;
