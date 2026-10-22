"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Compass, Workflow, UserCircle } from "lucide-react";

const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/dashboard/opportunities", label: "Capital", icon: Compass },
  { href: "/dashboard/erp", label: "ERP", icon: Workflow },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Only show on mobile (viewport < 1024px)
    const check = () => setVisible(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!visible) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-indigo-200 bg-white/95 px-2 py-1.5 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${
              isActive ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
