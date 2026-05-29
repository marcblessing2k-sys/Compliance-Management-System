import { useEffect, useRef, useState } from 'react';

interface UseInactivityTimeoutOptions {
  timeout: number; // in milliseconds
  onTimeout: () => void;
  warningTime?: number; // Show warning before timeout (in milliseconds)
}

export function useInactivityTimeout({
  timeout,
  onTimeout,
  warningTime
}: UseInactivityTimeoutOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = (seconds: number) => {
    setSecondsRemaining(seconds);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    countdownRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    clearTimers();
    setShowWarning(false);

    // Set warning timer if warningTime is provided
    if (warningTime) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        const remainingSeconds = Math.floor((timeout - warningTime) / 1000);
        startCountdown(remainingSeconds);
      }, warningTime);
    }

    // Set main timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  };

  const extendSession = () => {
    resetTimer();
  };

  useEffect(() => {
    // Events to track user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [timeout, onTimeout, warningTime]);

  return {
    showWarning,
    secondsRemaining,
    extendSession
  };
}
