"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavLayoutProps = {
	children: React.ReactNode;
};

const NAV_ITEMS: { label: string; href: string; icon: JSX.Element }[] = [
	{
		label: "Home",
		href: "/",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M3 11.5 12 4l9 7.5" />
				<path d="M5 10v10h5v-6h4v6h5V10" />
			</svg>
		),
	},
	{
		label: "Leaderboard",
		href: "/leaderboard",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M4 10h4v10H4zM10 4h4v16h-4zM16 13h4v7h-4z" />
			</svg>
		),
	},
	{
		label: "Profile",
		href: "/profile",
		icon: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-8 9a8 8 0 0 1 16 0" />
			</svg>
		),
	},
];

export default function BottomNavLayout({ children }: BottomNavLayoutProps) {
	const pathname = usePathname();

	return (
			<div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] bg-[var(--app-background)]">
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

