"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      {/* Background banner with atmospheric gradient */}
      <div className="absolute inset-0">
        <div className="h-full w-full bg-gradient-to-br from-indigo-900 via-violet-900 to-blue-900" />
        {/* Mountain/city silhouette via SVG */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
          <path
            d="M0,400 L0,280 L120,200 L240,260 L380,160 L520,240 L680,140 L820,220 L960,160 L1120,240 L1280,180 L1440,220 L1440,400 Z"
            fill="rgba(255,255,255,0.05)"
          />
          <path
            d="M0,400 L0,340 L160,280 L320,320 L480,260 L640,300 L800,240 L960,280 L1120,260 L1280,300 L1440,280 L1440,400 Z"
            fill="rgba(255,255,255,0.08)"
          />
          {/* Stars */}
          {[...Array(30)].map((_, i) => (
            <circle
              key={i}
              cx={(i * 47) % 1440}
              cy={(i * 31) % 200}
              r={i % 2 === 0 ? 1 : 0.5}
              fill="white"
              opacity={0.3 + (i % 3) * 0.2}
            />
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-5 py-24 text-center sm:px-8 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-sans text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Build Real Businesses.<br />Create Lasting Value.
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-sans text-base text-indigo-100 sm:text-lg">
            Your capital. Your work. Your company.
            No speculation required.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-sans text-sm font-semibold text-indigo-700 shadow-xl transition-all hover:shadow-2xl hover:brightness-105"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 font-sans text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Explore Platform
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
