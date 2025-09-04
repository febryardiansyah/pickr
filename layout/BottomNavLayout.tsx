"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Settings } from "lucide-react";

type BottomNavLayoutProps = {
  children: React.ReactNode;
};

const NAV_ITEMS: { label: string; href: string; icon: JSX.Element }[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home />,
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: <Trophy />,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <Settings />,
  },
];

export default function BottomNavLayout({ children }: BottomNavLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)]">
      <div className="flex-1 w-full max-w-md mx-auto px-4 pt-4 pb-28">
        {children}
      </div>
      <div className="bottom-nav-container">
        <nav className="bottom-nav-inner">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "bottom-nav-item " + (active ? "bottom-nav-item-active" : "")
                }
              >
                {active && <span className="active-bg" aria-hidden />}
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
