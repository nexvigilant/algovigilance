'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Flame, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MilestoneInfo } from '../[id]/enrollment-actions';

interface MilestoneCelebrationProps {
  milestone: MilestoneInfo;
  onDismiss: () => void;
}

const CELEBRATION_ICONS = {
  25: Rocket,
  50: Star,
  75: Flame,
  100: Trophy,
};

const CELEBRATION_COLORS = {
  25: 'from-cyan to-cyan-glow',
  50: 'from-gold to-gold-bright',
  75: 'from-orange-500 to-red-500',
  100: 'from-gold via-amber-400 to-gold-bright',
};

export function MilestoneCelebration({ milestone, onDismiss }: MilestoneCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = CELEBRATION_ICONS[milestone.milestone];
  const colorGradient = CELEBRATION_COLORS[milestone.milestone];

  // Auto-dismiss after 5 seconds for non-100% milestones
  useEffect(() => {
    if (milestone.milestone !== 100) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [milestone.milestone, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Celebration modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-nex-surface border border-nex-light rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-slate-dim hover:text-slate-light transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center mb-6 shadow-lg`}
              >
                <Icon className="h-10 w-10 text-nex-deep" />
              </motion.div>

              {/* Milestone percentage */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-5xl font-bold bg-gradient-to-r from-gold to-cyan bg-clip-text text-transparent">
                  {milestone.milestone}%
                </span>
              </motion.div>

              {/* Emoji and message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4"
              >
                <span className="text-3xl mb-2 block">{milestone.emoji}</span>
                <p className="text-lg text-slate-light font-medium">
                  {milestone.message}
                </p>
              </motion.div>

              {/* Continue button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <Button
                  onClick={handleDismiss}
                  className="bg-cyan hover:bg-cyan-glow text-nex-deep font-semibold px-8"
                >
                  {milestone.milestone === 100 ? 'View Certificate' : 'Keep Going'}
                </Button>
              </motion.div>

              {/* Particle effects for 100% completion */}
              {milestone.milestone === 100 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 1,
                        x: '50%',
                        y: '50%',
                        scale: 0,
                      }}
                      animate={{
                        opacity: 0,
                        x: `${50 + (Math.random() - 0.5) * 200}%`,
                        y: `${50 + (Math.random() - 0.5) * 200}%`,
                        scale: Math.random() * 2 + 1,
                      }}
                      transition={{
                        duration: 2,
                        delay: Math.random() * 0.5,
                        ease: 'easeOut',
                      }}
                      className={`absolute w-2 h-2 rounded-full ${
                        i % 3 === 0 ? 'bg-gold' : i % 3 === 1 ? 'bg-cyan' : 'bg-amber-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
