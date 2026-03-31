'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    delay?: number;
}

export function AnimatedStaggerContainer({ children, className, delay = 0.1, ...props }: StaggerContainerProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: delay }
                }
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}

interface StaggerItemProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
}

export function AnimatedStaggerItem({ children, className, ...props }: StaggerItemProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
}
