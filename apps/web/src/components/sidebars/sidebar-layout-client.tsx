"use client";

import type { ReactNode } from "react";
import { SidebarTransitionProvider } from "@/components/sidebars/sidebar-transition-provider";

export function SidebarLayoutClient({ sidebar }: { sidebar: ReactNode }) {
	return <SidebarTransitionProvider>{sidebar}</SidebarTransitionProvider>;
}
