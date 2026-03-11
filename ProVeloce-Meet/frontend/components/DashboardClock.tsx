'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface DashboardClockProps {
  className?: string;
}

const DashboardClock = ({ className = '' }: DashboardClockProps) => {
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

    // Update every second for live clock
    intervalRef.current = setInterval(updateTime, 1000);

    // Cleanup function
    return () => {
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
      className={`font-extrabold tabular-nums select-none ${className}`}
      suppressHydrationWarning
      aria-live="polite"
      aria-label={`Current time: ${time}`}
    >
      {time}
    </time>
  );
};

export default DashboardClock;

