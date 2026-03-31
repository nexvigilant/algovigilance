'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LAUNCH_TIMESTAMP } from '@/data/launch-timeline';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date().getTime();
  const difference = LAUNCH_TIMESTAMP - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

interface TimeUnitProps {
  value: number;
  label: string;
  delay: number;
}

function TimeUnit({ value, label, delay }: TimeUnitProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-gold-500/20 blur-lg" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-nex-light bg-nex-surface/80 backdrop-blur-sm sm:h-20 sm:w-20 md:h-24 md:w-24">
          <span className="font-headline text-xl font-bold text-white sm:text-3xl md:text-4xl">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-dim">
        {label}
      </span>
    </motion.div>
  );
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Prevent hydration mismatch by showing placeholder until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, i) => (
            <TimeUnit key={label} value={0} label={label} delay={i * 0.1} />
          ))}
        </div>
      </div>
    );
  }

  const isLaunched = timeLeft.days === 0 && timeLeft.hours === 0 &&
                     timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isLaunched) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <p className="font-headline text-2xl font-bold text-cyan-400">
          We&apos;re Live!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm font-medium uppercase tracking-widest text-gold-400"
      >
        Beta Launch Countdown
      </motion.p>

      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <TimeUnit value={timeLeft.days} label="Days" delay={0} />
        <span className="mt-[-1.5rem] text-2xl text-slate-dim">:</span>
        <TimeUnit value={timeLeft.hours} label="Hours" delay={0.1} />
        <span className="mt-[-1.5rem] text-2xl text-slate-dim">:</span>
        <TimeUnit value={timeLeft.minutes} label="Minutes" delay={0.2} />
        <span className="mt-[-1.5rem] text-2xl text-slate-dim">:</span>
        <TimeUnit value={timeLeft.seconds} label="Seconds" delay={0.3} />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-base font-medium text-cyan-400"
      >
        December 13, 2025 at 10:00 AM EST
      </motion.p>
    </div>
  );
}
