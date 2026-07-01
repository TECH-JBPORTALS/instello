"use client";

import { usePathname } from "next/navigation";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { getSidebarMode, type SidebarMode } from "@/lib/sidebar-mode";

type TransitionDirection = "left" | "right";

type SidebarTransitionContextValue = {
	shouldAnimate: boolean;
	direction: TransitionDirection;
};

const SidebarTransitionContext = createContext<SidebarTransitionContextValue>({
	shouldAnimate: false,
	direction: "left",
});

function getTransitionDirection(
	from: SidebarMode,
	to: SidebarMode,
): TransitionDirection {
	if (from === "institution" && to === "program") return "left";
	if (from === "program" && to === "class") return "left";
	return "right";
}

export function SidebarTransitionProvider({
	children,
}: {
	children: ReactNode;
}) {
	const pathname = usePathname();
	const currentMode = getSidebarMode(pathname);
	const previousModeRef = useRef<SidebarMode | null>(null);
	const isInitialMountRef = useRef(true);
	const [transition, setTransition] = useState<SidebarTransitionContextValue>({
		shouldAnimate: false,
		direction: "left",
	});

	useEffect(() => {
		const previousMode = previousModeRef.current;

		if (isInitialMountRef.current) {
			isInitialMountRef.current = false;
			previousModeRef.current = currentMode;
			setTransition({ shouldAnimate: false, direction: "left" });
			return;
		}

		if (previousMode === null || previousMode === currentMode) {
			setTransition({ shouldAnimate: false, direction: "right" });
		} else {
			setTransition({
				shouldAnimate: true,
				direction: getTransitionDirection(previousMode, currentMode),
			});
		}

		previousModeRef.current = currentMode;
	}, [currentMode]);

	return (
		<SidebarTransitionContext.Provider value={transition}>
			{children}
		</SidebarTransitionContext.Provider>
	);
}

export function useSidebarTransition(mode: SidebarMode) {
	const transition = useContext(SidebarTransitionContext);
	const pathname = usePathname();
	const activeMode = getSidebarMode(pathname);

	if (activeMode !== mode) {
		return { shouldAnimate: false, direction: "left" as const };
	}

	return transition;
}
