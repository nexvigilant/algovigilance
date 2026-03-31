"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { VersionBadge } from "@/components/shared/banners";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

const HeroAgentSearch = dynamic(
  () => import("@/components/agent").then((mod) => mod.HeroAgentSearch),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-2xl h-14 rounded-full border border-white/[0.12] bg-white/[0.06] animate-pulse" />
    ),
  },
);

export function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      650px circle at ${mouseX}px ${mouseY}px,
      rgba(123, 149, 181, 0.08),
      transparent 80%
    )
  `;

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    if (!currentTarget) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-start md:justify-center overflow-hidden scanline-effect group"
      style={{ "--scanline-opacity": "0.02" } as React.CSSProperties}
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Spotlight Overlay */}
      {isMounted && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 mix-blend-screen"
          style={{
            background: spotlightBackground,
            zIndex: 1,
          }}
        />
      )}

      {/* Subtle grid overlay */}
      <div className="bg-grid-white/[0.015] pointer-events-none absolute inset-0 h-full w-full" />

      {/* Depth mask - creates center focus */}
      <div className="pointer-events-none absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent_0%,black_100%)]" />

      {/* Primary glow - subtle ember warmth from top */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[1400px] -translate-x-1/2 animate-city-glow opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 0%, rgba(var(--nex-ember-rgb), 0.08) 0%, transparent 100%)",
        }}
      />

      {/* Secondary gold accent glow */}
      <div
        className="pointer-events-none absolute left-[15%] top-[30%] h-[400px] w-[500px] opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(var(--nex-gold-rgb), 0.06) 0%, transparent 100%)",
        }}
      />

      {/* Tertiary steel accent - right side */}
      <div
        className="pointer-events-none absolute right-[10%] top-[25%] h-[350px] w-[450px] opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(var(--nex-cyan-rgb), 0.05) 0%, transparent 100%)",
        }}
      />

      {/* Signal accent — ambient signal detection pulse */}
      <div
        className="pointer-events-none absolute right-[22%] top-[18%] h-[280px] w-[320px] animate-pulse-slow opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(212, 175, 55, 0.04) 0%, transparent 100%)",
          animationDelay: "-2s",
        }}
      />

      {/* Secondary signal — offset timing for organic feel */}
      <div
        className="pointer-events-none absolute left-[8%] bottom-[35%] h-[200px] w-[250px] animate-pulse-slow opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(123, 149, 181, 0.03) 0%, transparent 100%)",
          animationDelay: "-5s",
        }}
      />

      {/* Content wrapper with Staggered Entrance */}
      <motion.div
        className="relative z-10 mx-auto w-full max-w-golden-wide px-golden-3 md:px-golden-5 pt-20 md:pt-28 text-center overflow-hidden"
        data-neural-exclude
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Headline */}
        <motion.div variants={itemVariants}>
          <div className="mb-4 flex justify-center">
            <VersionBadge showPulse className="text-[10px] font-mono" />
          </div>
          <p className="text-lg font-mono uppercase tracking-widest text-cyan mb-golden-2">
            Vigilance Intelligence
          </p>
          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text pb-golden-2 font-headline text-[1.5rem] sm:text-golden-2xl md:text-golden-3xl lg:text-golden-4xl font-bold tracking-tight text-transparent leading-tight uppercase relative inline-block">
            The Science of
            <br />
            <motion.span
              className="bg-gradient-to-r from-gold-bright to-gold bg-clip-text text-transparent text-glow-gold inline-block"
              animate={{
                opacity: [0.85, 1, 0.85],
                textShadow: [
                  "0 0 20px rgba(212, 175, 55, 0.3), 0 2px 4px rgba(0,0,0, 0.8)",
                  "0 0 50px rgba(212, 175, 55, 0.6), 0 2px 4px rgba(0,0,0, 0.8)",
                  "0 0 20px rgba(212, 175, 55, 0.3), 0 2px 4px rgba(0,0,0, 0.8)",
                ],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Safety
            </motion.span>
          </h1>
        </motion.div>

        {/* Subhead - Strategic Value Prop */}
        <motion.p
          variants={itemVariants}
          className="mx-auto mt-golden-3 max-w-reading text-golden-lg leading-golden text-slate-light"
        >
          Vigilance intelligence across medicines, AI systems, and critical
          infrastructure — powered by{" "}
          <span className="font-semibold tracking-wide text-white">Ne</span>
          <motion.span
            className="font-semibold tracking-wide text-white inline-block"
            animate={{
              opacity: [0.85, 1, 0.85],
              textShadow: [
                "0 0 15px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0,0,0, 0.8)",
                "0 0 35px rgba(255, 255, 255, 0.6), 0 1px 2px rgba(0,0,0, 0.8)",
                "0 0 15px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0,0,0, 0.8)",
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            x
          </motion.span>
          <span className="font-semibold tracking-wide text-white">
            Vigilant
          </span>
          .
          <Link
            href="/about"
            className="inline-flex items-center mt-2 px-1 py-1 touch-target text-cyan font-medium hover:text-cyan-glow transition-colors underline decoration-cyan/40 hover:decoration-cyan underline-offset-4 ml-1"
          >
            Learn about us.
          </Link>
        </motion.p>

        {/* Agent Search Bar - Primary CTA */}
        <motion.div variants={itemVariants} className="mt-golden-5 px-4">
          <HeroAgentSearch placeholder="What can we help you with today?" />
        </motion.div>

        {/* Bottom spacer - accounts for cookie consent banner height on mobile */}
        <div className="pb-32 md:pb-40" />
      </motion.div>

      {/* Decorative Elements - Enhanced horizon */}
      <div
        className="absolute bottom-0 left-0 z-20 h-32 w-full pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(11, 13, 19, 1) 0%, rgba(11, 13, 19, 0.6) 50%, transparent 100%)",
        }}
      />

      {/* Prismatic horizon line */}
      <div className="absolute bottom-16 left-[5%] right-[5%] h-[1px] z-20 prismatic-bar opacity-60 pointer-events-none" />
    </div>
  );
}
