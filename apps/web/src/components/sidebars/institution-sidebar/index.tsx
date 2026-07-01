"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebarHeader } from "@/components/common/app-sidebar-header";
import { InstitutionSidebarFooter } from "@/components/sidebars/institution-sidebar/institution-sidebar-footer";
import {
	isNavActive,
	mainNavSections,
} from "@/components/sidebars/institution-sidebar/nav-items";
import { SidebarAnimatedContent } from "@/components/sidebars/sidebar-animated-content";

export function InstitutionSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar>
			<AppSidebarHeader />
			<SidebarAnimatedContent mode="institution">
				<SidebarContent>
					{mainNavSections.map((section) => (
						<SidebarGroup key={section.label ?? "main"}>
							{section.label ? (
								<SidebarGroupLabel>{section.label}</SidebarGroupLabel>
							) : null}
							<SidebarGroupContent>
								<SidebarMenu>
									{section.items.map((item) => (
										<SidebarMenuItem key={item.id}>
											<SidebarMenuButton
												isActive={isNavActive(pathname, item.href)}
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
					))}
				</SidebarContent>
			</SidebarAnimatedContent>
			<InstitutionSidebarFooter />
		</Sidebar>
	);
}
