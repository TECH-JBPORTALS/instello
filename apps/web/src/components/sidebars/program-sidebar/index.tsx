"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProgramSegment } from "@/lib/sidebar-mode";
import { isProgramNavActive, programNavItems } from "./nav-items";
import { ProgramLink } from "./program-link";

export function ProgramSidebarContent() {
	const pathname = usePathname();
	const currentSegment = getProgramSegment(pathname);

	return (
		<>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton render={<Link href={"/programs"} />}>
							<IconArrowLeft /> Programs
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarGroup>
				<SidebarGroupLabel>PROGRAM</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{programNavItems.map((item) => (
							<SidebarMenuItem key={item.id}>
								<SidebarMenuButton
									isActive={isProgramNavActive(currentSegment, item.segment)}
									render={<ProgramLink segment={item.segment} />}
								>
									<item.icon className="size-4" />
									{item.label}
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</>
	);
}
