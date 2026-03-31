'use client';

import React, { useRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HolographicProtocolCardProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  variant?: 'cyan' | 'gold';
  layout?: 'vertical' | 'horizontal';
  alignment?: 'left' | 'center';
  className?: string;
}

export function HolographicProtocolCard({
  icon: Icon,
  title,
  description,
  variant = 'cyan',
  layout = 'vertical',
  alignment = 'center',
  className
}: HolographicProtocolCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tiltLimit = 5;
  const springConfig = { damping: 40, stiffness: 400, mass: 0.5 };
  const xSpring = useSpring(mouseX, springConfig);
  const ySpring = useSpring(mouseY, springConfig);

  const rotateX = useTransform(ySpring, [-0.5, 0.5], [tiltLimit, -tiltLimit]);
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-tiltLimit, tiltLimit]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const hoverBorder = variant === 'cyan' ? 'hover:border-cyan/50' : 'hover:border-gold/50';
  const iconColor = variant === 'cyan' ? "text-cyan" : "text-gold";

  if (layout === 'horizontal') {
    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: 'preserve-3d', rotateX, rotateY }}
        whileHover={{ scale: 1.02, zIndex: 10 }}
        className="h-full"
      >
        <Card className={cn(
          "holographic-card border-white/[0.12] bg-white/[0.06] p-6 transition-colors duration-300",
          hoverBorder,
          className
        )}>
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-white/[0.04] p-2">
              <Icon className={cn("h-8 w-8", iconColor)} aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold text-slate-light">{title}</h3>
          </div>
          <div className="mt-4 text-slate-dim">
            {description}
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', rotateX, rotateY }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      className="h-full"
    >
      <Card className={cn(
        "holographic-card border-white/[0.12] bg-white/[0.06] transition-colors duration-300",
        hoverBorder,
        alignment === 'center' ? "text-center" : "text-left",
        className
      )}>
        <CardHeader>
          <div className={cn(
            "w-fit rounded-xl bg-white/[0.04] p-3",
            alignment === 'center' ? "mx-auto" : "mx-0"
          )}>
            <Icon className={cn("h-10 w-10", iconColor)} aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-slate-light">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-dim">
            {description}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}