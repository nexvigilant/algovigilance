'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MarketingSectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export function MarketingSectionHeader({
  label,
  title,
  description,
  alignment = 'center',
  className
}: MarketingSectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "mb-8",
        alignment === 'center' ? "text-center" : "text-left",
        className
      )}
    >
      <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-3">
        {label}
      </p>
      <h2 className="font-headline text-3xl font-bold text-gold md:text-4xl uppercase tracking-wide">
        {title}
      </h2>
      {description && (
        <p className={cn(
          "mt-4 text-slate-dim max-w-2xl",
          alignment === 'center' && "mx-auto"
        )}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
