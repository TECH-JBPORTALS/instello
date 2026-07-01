"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { SidebarMode } from "@/lib/sidebar-mode";
import { useSidebarTransition } from "./sidebar-transition-provider";

export function SidebarAnimatedContent({
	children,
	mode,
}: {
	children: ReactNode;
	mode: SidebarMode;
}) {
	const { shouldAnimate, direction } = useSidebarTransition(mode);

	return (
		<motion.div
			initial={
				shouldAnimate
					? { x: direction === "left" ? -24 : 24, opacity: 0 }
					: false
			}
			animate={{ x: 0, opacity: 1 }}
			transition={{ duration: 0.2, ease: "easeInOut" }}
			className="flex h-full flex-col"
		>
			{children}
		</motion.div>
	);
}
