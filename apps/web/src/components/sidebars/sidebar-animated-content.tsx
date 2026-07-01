"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function SidebarAnimatedContent({
	children,
	dir = "left",
}: {
	children: ReactNode;
	dir?: "left" | "right";
}) {
	return (
		<motion.div
			initial={{ x: dir === "left" ? -24 : 24, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			transition={{ duration: 0.2, ease: "easeInOut" }}
			className="flex h-full flex-col"
		>
			{children}
		</motion.div>
	);
}
