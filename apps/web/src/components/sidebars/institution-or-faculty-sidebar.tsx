"use client";

import { api } from "@instello/convex/api";
import {
	SidebarGroup,
	SidebarMenuSkeleton,
} from "@instello/ui/components/sidebar";
import { FacultySidebarContent } from "@/components/sidebars/faculty-sidebar";
import { InstitutionSidebarContent } from "@/components/sidebars/institution-sidebar";
import { useInsQuery } from "@/hooks/convex-react";

export function InstitutionOrFacultySidebar() {
	const user = useInsQuery(api.users.getCurrentUserInInstitution);

	if (user === undefined) {
		return (
			<SidebarGroup>
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
				<SidebarMenuSkeleton />
			</SidebarGroup>
		);
	}

	if (user.role === "faculty") {
		return <FacultySidebarContent />;
	}

	return <InstitutionSidebarContent />;
}
