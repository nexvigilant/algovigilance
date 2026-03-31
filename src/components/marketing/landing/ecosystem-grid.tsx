"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ecosystemServices,
  type EcosystemService,
} from "@/data/ecosystem-services";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

function HoverCard({
  service,
  index,
}: {
  service: EcosystemService;
  index: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const borderBackground = useMotionTemplate`
    radial-gradient(
      400px circle at ${mouseX}px ${mouseY}px,
      rgba(123, 149, 181, 0.45),
      transparent 80%
    )
  `;

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      className="h-full"
    >
      <Link
        href={service.href}
        className={cn(
          "group block h-full",
          service.status &&
            "opacity-60 hover:opacity-80 transition-opacity duration-300",
        )}
      >
        <div
          className={cn(
            "relative h-full rounded-2xl transition-all duration-300 group-hover:-translate-y-1",
            service.status ? "" : "p-[1px]", // Reserve space for the glowing border
            service.hoverBorder,
          )}
          onMouseMove={handleMouseMove}
        >
          {/* Glowing Edge Border - Follows Mouse */}
          {!service.status && (
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100 z-0"
              style={{
                background: borderBackground,
              }}
            />
          )}

          {/* Actual Card Content Surface */}
          <div
            className={cn(
              "relative h-full overflow-hidden rounded-[15px] glass-card p-golden-4 z-10 w-full",
              service.status
                ? "border-dashed border-white/20"
                : "bg-[#1E2430]/90 border border-white/[0.05]",
            )}
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-gold/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Lex Primitiva symbol watermark */}
            {service.symbol && (
              <div className="absolute -bottom-6 -right-4 text-[100px] font-mono font-black opacity-[0.05] group-hover:opacity-[0.12] transition-opacity duration-500 select-none pointer-events-none">
                {service.symbol}
              </div>
            )}

            <div className="relative z-10">
              <div
                className={cn(
                  "mb-golden-3 flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.04] transition-transform duration-300 group-hover:scale-110",
                  service.color,
                )}
              >
                <service.icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="mb-golden-2 text-golden-lg font-bold text-white transition-colors group-hover:text-cyan-400">
                {service.title}
              </h3>

              <p className="mb-golden-3 text-golden-base leading-golden text-slate-dim">
                {service.description}
              </p>

              {service.status ? (
                <span className="inline-block rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-dim">
                  {service.status}
                </span>
              ) : (
                <div className="flex translate-x-[-10px] transform items-center text-sm font-medium text-cyan-400 opacity-0 transition-opacity duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  Explore{" "}
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function EcosystemGrid() {
  return (
    <section className="relative overflow-hidden px-golden-3 md:px-golden-5 py-golden-6">
      <div className="mx-auto max-w-golden-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mb-golden-5 text-center"
          data-neural-exclude
        >
          <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-golden-2">
            // Our Platform
          </p>
          <h2 className="mb-golden-2 font-headline text-golden-2xl font-bold text-white md:text-golden-3xl leading-tight uppercase tracking-wide">
            What We Offer
          </h2>
          <p className="mx-auto max-w-reading text-golden-lg leading-golden text-slate-dim">
            Training, tools, and services for vigilant professionals.
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 gap-golden-3 md:grid-cols-2 lg:grid-cols-3"
          data-neural-exclude
        >
          {ecosystemServices.map((service, index) => (
            <HoverCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
