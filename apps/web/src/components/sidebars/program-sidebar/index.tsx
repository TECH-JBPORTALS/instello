"use client";

import {
	Sidebar,
	SidebarContent,
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
import { AppSidebarHeader } from "@/components/common/app-sidebar-header";
import { InstitutionSidebarFooter } from "@/components/sidebars/institution-sidebar/institution-sidebar-footer";
import { getProgramSegment } from "@/lib/sidebar-mode";
import { SidebarAnimatedContent } from "../sidebar-animated-content";
import { ClassSwitcher } from "../switchers/class-switcher";
import { ProgramSwitcher } from "../switchers/program-switcher";
import { isProgramNavActive, programNavItems } from "./nav-items";
import { ProgramLink } from "./program-link";

export function ProgramSidebar() {
	const pathname = usePathname();
	const currentSegment = getProgramSegment(pathname);

	return (
		<Sidebar>
			<AppSidebarHeader />
			<SidebarHeader>
				<ProgramSwitcher />
				<ClassSwitcher />
			</SidebarHeader>
			<SidebarAnimatedContent dir="right">
				<SidebarContent>
					<SidebarGroup>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton render={<Link href={"/programs"} />}>
									<IconArrowLeft /> Programs
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
					<SidebarGroup>
						<SidebarGroupLabel>ACADEMICS</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{programNavItems.map((item) => (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											isActive={isProgramNavActive(
												currentSegment,
												item.segment,
											)}
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
				</SidebarContent>
			</SidebarAnimatedContent>
			<InstitutionSidebarFooter />
		</Sidebar>
	);
}
