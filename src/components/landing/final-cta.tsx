"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      {/* Exact gradient from reference: 135deg indigo-700 to indigo-950 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4338CA] to-[#1E1B4B]" />
      {/* Mountain silhouette */}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <path d="M0,400 L0,280 L120,200 L240,260 L380,160 L520,240 L680,140 L820,220 L960,160 L1120,240 L1280,180 L1440,220 L1440,400 Z" fill="rgba(255,255,255,0.05)" />
        <path d="M0,400 L0,340 L160,280 L320,320 L480,260 L640,300 L800,240 L960,280 L1120,260 L1280,300 L1440,280 L1440,400 Z" fill="rgba(255,255,255,0.08)" />
        {[...Array(40)].map((_, i) => (
          <circle key={i} cx={(i * 47) % 1440} cy={(i * 31) % 200} r={i % 2 === 0 ? 1 : 0.5} fill="white" opacity={0.2 + (i % 4) * 0.15} />
        ))}
      </svg>

      {/* AURIENTA symbol bottom-right */}
      <div className="absolute bottom-8 right-8 hidden lg:block">
        <svg viewBox="0 0 40 44" className="h-12 w-12 opacity-20" fill="none">
          <path d="M20 4 L4 40 L10 40 L20 16 L30 40 L36 40 Z" fill="white" />
          <rect x="12" y="26" width="16" height="3" rx="1" fill="white" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-6 py-[100px] text-center lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <h2 className="font-sans text-[40px] font-bold leading-tight text-white sm:text-[48px]">
            Build Real Businesses.<br />Create Lasting Value.
          </h2>
          <p className="mx-auto mt-6 max-w-[480px] font-sans text-[18px] text-indigo-100">
            Your capital. Your work. Your company.<br />No speculation required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="group inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 font-sans text-[14px] font-semibold text-[#3730A3] shadow-xl transition-all hover:shadow-2xl hover:brightness-105">
              Get Started <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/trust" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-7 py-3.5 font-sans text-[14px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20">
              Explore Platform <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
