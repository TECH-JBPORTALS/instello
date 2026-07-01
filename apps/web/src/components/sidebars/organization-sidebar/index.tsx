"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import { IconBuildings, IconCircleDottedLetterP } from "@tabler/icons-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { AppSidebarHeader } from "@/components/common/app-sidebar-header";

const items = (orgSlug: string) => [
	{
		id: 1,
		href: `/${orgSlug}`,
		icon: IconBuildings,
		label: "My Institutions",
		exact: true,
	},
	{
		id: 2,
		href: `/${orgSlug}/academic-patterns`,
		icon: IconCircleDottedLetterP,
		label: "Academic Patterns",
		exact: false,
	},
];

export function OrganizationSidebar() {
	const pathname = usePathname();
	const { orgSlug } = useParams<{ orgSlug: string }>();

	return (
		<Sidebar>
			<AppSidebarHeader />
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{items(orgSlug).map((item) => (
							<SidebarMenuItem key={item.id}>
								<SidebarMenuButton
									isActive={
										item.exact
											? pathname === item.href
											: pathname.startsWith(item.href)
									}
									render={<Link href={item.href} />}
								>
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
