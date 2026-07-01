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
import {
	isNavActive,
	mainNavSections,
} from "@/components/sidebars/institution-sidebar/nav-items";

export function InstitutionSidebarContent() {
	const pathname = usePathname();

	return (
		<>
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
		</>
	);
}
