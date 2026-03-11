'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const Clock = () => {
  const [time, setTime] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTime = useCallback(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    // Set initial time immediately
    updateTime();

    // Calculate milliseconds until next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // Set timeout for first update at the next minute
    const timeoutId = setTimeout(() => {
      updateTime();
      // Then set interval for every minute after that
      intervalRef.current = setInterval(updateTime, 60000);
    }, msUntilNextMinute);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateTime]);

  // Use visibility API to sync time when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateTime]);

  if (!time) return null;

  return (
    <time 
      dateTime={time} 
      className="text-sm font-semibold text-text-secondary tabular-nums select-none transition-opacity duration-200"
      suppressHydrationWarning
      aria-live="polite"
      aria-label={`Current time: ${time}`}
    >
      {time}
    </time>
  );
};

export default Clock;

