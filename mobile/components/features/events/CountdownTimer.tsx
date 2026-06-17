import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

interface CountdownTimerProps {
  startTime: string;
  endTime: string;
  onStateChange?: (state: 'UPCOMING' | 'LIVE' | 'ENDED') => void;
}

export function CountdownTimer({ startTime, endTime, onStateChange }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [state, setState] = useState<'UPCOMING' | 'LIVE' | 'ENDED'>('UPCOMING');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (now < start) {
        if (state !== 'UPCOMING') {
          setState('UPCOMING');
          onStateChange?.('UPCOMING');
        }
        const diff = start - now;
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Starts in ${h}h ${m}m ${s}s`);
      } else if (now >= start && now <= end) {
        if (state !== 'LIVE') {
          setState('LIVE');
          onStateChange?.('LIVE');
        }
        const diff = end - now;
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Format as HH:MM:SS
        const formatted = [
          h.toString().padStart(2, '0'),
          m.toString().padStart(2, '0'),
          s.toString().padStart(2, '0')
        ].join(':');
        
        setTimeLeft(formatted);
      } else {
        if (state !== 'ENDED') {
          setState('ENDED');
          onStateChange?.('ENDED');
        }
        setTimeLeft('Ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, state]);

  return <Text style={[styles.timer, state === 'LIVE' && styles.live]}>{timeLeft}</Text>;
}

const styles = StyleSheet.create({
  timer: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: '800',
    color: '#94a3b8',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  live: {
    color: '#10b981', // green for active
  }
});
