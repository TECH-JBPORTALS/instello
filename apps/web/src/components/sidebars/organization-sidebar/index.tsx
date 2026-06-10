"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import { Building2Icon, ChartGanttIcon } from "lucide-react";
import { AppSidebarHeader } from "@/components/common/app-sidebar-header";

const items = [
	{
		id: 1,
		href: "/",
		icon: Building2Icon,
		label: "Institutions",
	},
	{
		id: 2,
		href: "/insights",
		icon: ChartGanttIcon,
		label: "Insights",
	},
];

export function OrganizationSidebar() {
	return (
		<Sidebar>
			<AppSidebarHeader />
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Organization</SidebarGroupLabel>
					<SidebarMenu>
						{items.map((item) => (
							<SidebarMenuItem key={item.id}>
								<SidebarMenuButton>
									<item.icon className="w-4 h-4" />
									{item.label}
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
