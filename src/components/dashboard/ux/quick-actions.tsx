"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Compass, ClipboardList, Workflow, Fingerprint, PieChart, ArrowRight } from "lucide-react";

const QUICK_ACTIONS = [
  { href: "/dashboard/portfolio", label: "Portfolio", desc: "View holdings", icon: Wallet, color: "#4F46E5" },
  { href: "/dashboard/opportunities", label: "Opportunities", desc: "Browse enterprises", icon: Compass, color: "#7C3AED" },
  { href: "/dashboard", label: "Tasks", desc: "Check action items", icon: ClipboardList, color: "#06B6D4" },
  { href: "/dashboard/erp", label: "ERP", desc: "Manage operations", icon: Workflow, color: "#10B981" },
  { href: "/dashboard/soulbound", label: "Soulbound", desc: "Mint credential", icon: Fingerprint, color: "#818CF8" },
  { href: "/dashboard/dividends", label: "Dividends", desc: "View payouts", icon: PieChart, color: "#F59E0B" },
];

export function QuickActions() {
  return (
    <Card className="border-indigo-200/60 bg-gradient-to-br from-indigo-50/60 to-white">
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-sans text-base font-semibold text-[#1E1B4B]">Quick Actions</h3>
            <p className="text-xs text-slate-500">What should I do next?</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center transition-all hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: action.color + "15" }}
                >
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1E1B4B]">{action.label}</p>
                  <p className="text-[10px] text-slate-400">{action.desc}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
