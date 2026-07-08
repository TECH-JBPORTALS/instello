"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
} from "@instello/ui/components/sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { AppSidebarHeader } from "@/components/common/app-sidebar-header";
import { InstitutionSidebarFooter } from "@/components/sidebars/institution-sidebar/institution-sidebar-footer";
import { ClassSwitcher } from "@/components/sidebars/switchers/class-switcher";
import { ProgramSwitcher } from "@/components/sidebars/switchers/program-switcher";
import { getSidebarMode, type SidebarMode } from "@/lib/sidebar-mode";

const OFFSET = 120;

const SIDEBAR_MODE_DEPTH: Record<SidebarMode, number> = {
	institution: 0,
	"institution-settings": 0,
	program: 1,
	class: 2,
};

function getTransitionDirection(
	from: SidebarMode,
	to: SidebarMode,
): "left" | "right" {
	const fromDepth = SIDEBAR_MODE_DEPTH[from];
	const toDepth = SIDEBAR_MODE_DEPTH[to];
	if (toDepth > fromDepth) return "right";
	if (toDepth < fromDepth) return "left";
	return "right";
}

const variants = {
	initial: (direction: "left" | "right") => ({
		x: direction === "left" ? -OFFSET : OFFSET,

		opacity: 0,
	}),

	animate: {
		x: 0,

		opacity: 1,
	},

	exit: (direction: "left" | "right") => ({
		x: direction === "left" ? OFFSET : -OFFSET,

		opacity: 0,
	}),
};

export function SidebarLayoutClient({ sidebar }: { sidebar: ReactNode }) {
	const pathname = usePathname();
	const mode = getSidebarMode(pathname);
	const prevModeRef = useRef(mode);
	const directionRef = useRef<"left" | "right">("right");

	if (prevModeRef.current !== mode) {
		directionRef.current = getTransitionDirection(prevModeRef.current, mode);
	}

	useLayoutEffect(() => {
		prevModeRef.current = mode;
	}, [mode]);

	const showSwitchers = mode === "program" || mode === "class";

	return (
		<Sidebar>
			<AppSidebarHeader />
			{showSwitchers ? (
				<SidebarHeader>
					<ProgramSwitcher />
					<ClassSwitcher />
				</SidebarHeader>
			) : null}
			<SidebarContent className="overflow-x-hidden">
				<AnimatePresence
					mode="wait"
					custom={directionRef.current}
					initial={false}
				>
					<motion.div
						variants={variants}
						custom={directionRef.current}
						key={mode}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.2, ease: "anticipate" }}
						className="flex min-h-0 flex-1 flex-col"
					>
						{sidebar}
					</motion.div>
				</AnimatePresence>
			</SidebarContent>
			<InstitutionSidebarFooter />
		</Sidebar>
	);
}
