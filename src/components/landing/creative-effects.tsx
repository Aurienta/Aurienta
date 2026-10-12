"use client";

import * as React from "react";
import { motion, useInView, animate, useMotionValue } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// CREATIVE 1: Animated Counter — counts up when scrolled into view
// ═══════════════════════════════════════════════════════════════

export function AnimatedCounter({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 2,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = React.useState("0");

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) =>
        setDisplay(
          v.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        ),
    });
    return () => controls.stop();
  }, [inView, to, decimals, duration, mv]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATIVE 2: Constitutional Trust Gauge — circular SVG meter
// ═══════════════════════════════════════════════════════════════

export function TrustGauge({
  score,
  size = 120,
  label = "Trust Score",
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "#10B981" : score >= 70 ? "#4F46E5" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="6"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-sans text-2xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="font-sans text-[10px] text-slate-400">{label}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATIVE 3: Magnetic Hover Button — follows cursor subtly
// ═══════════════════════════════════════════════════════════════

export function MagneticHover({
  children,
  className,
  strength = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * strength, y: y * strength });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={className}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: "transform 0.2s ease-out",
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATIVE 4: Scroll Reveal — elements fade + rise when scrolled into view
// ═══════════════════════════════════════════════════════════════

export function ScrollReveal({
  children,
  delay = 0,
  y = 30,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATIVE 5: Live Stats Ticker — animated platform metrics
// ═══════════════════════════════════════════════════════════════

export function LiveStatsTicker() {
  const [stats, setStats] = React.useState({
    capital: 280500000,
    partners: 5,
    enterprises: 4,
    uptime: 99.95,
  });

  // Simulate live updates every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        capital: prev.capital + Math.floor(Math.random() * 50000),
        partners: prev.partners,
        enterprises: prev.enterprises,
        uptime: Math.min(99.99, prev.uptime + Math.random() * 0.001),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { label: "Capital Deployed", value: <AnimatedCounter to={stats.capital / 1000000} decimals={1} suffix="M" prefix="EGP " /> },
    { label: "Active Partners", value: <AnimatedCounter to={stats.partners} /> },
    { label: "Enterprises", value: <AnimatedCounter to={stats.enterprises} /> },
    { label: "CRE Uptime", value: <AnimatedCounter to={stats.uptime} decimals={2} suffix="%" /> },
  ];

  return (
    <div className="flex flex-wrap items-center gap-8">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col">
          <span className="font-sans text-xl font-bold text-[#4F46E5]">{item.value}</span>
          <span className="font-sans text-xs text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
