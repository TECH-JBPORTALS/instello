"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FacultyAssignmentsCard } from "@/components/sidebars/faculty-sidebar/assignments-card";
import {
	facultyNavItems,
	isFacultyNavActive,
} from "@/components/sidebars/faculty-sidebar/nav-items";

export function FacultySidebarContent() {
	const pathname = usePathname();

	return (
		<>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						{facultyNavItems.map((item) => (
							<SidebarMenuItem key={item.id}>
								<SidebarMenuButton
									size="sm"
									isActive={isFacultyNavActive(pathname, item.href)}
									render={<Link href={item.href} />}
								>
									<item.icon className="size-4" />
									{item.label}
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarGroup>
				<SidebarGroupLabel>ALLOCATED SUBJECTS</SidebarGroupLabel>
				<SidebarGroupContent>
					<FacultyAssignmentsCard />
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);
}
