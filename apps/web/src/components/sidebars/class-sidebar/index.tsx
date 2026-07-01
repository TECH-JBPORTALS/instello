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
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";
import { getClassSegment } from "@/lib/sidebar-mode";
import { SidebarAnimatedContent } from "../sidebar-animated-content";
import { ClassSwitcher } from "../switchers/class-switcher";
import { ProgramSwitcher } from "../switchers/program-switcher";
import { ClassLink } from "./class-link";
import { classNavItems, isClassNavActive } from "./nav-items";

export function ClassSidebar() {
	const pathname = usePathname();
	const programAlias = useProgramAlias();
	const currentSegment = getClassSegment(pathname);

	return (
		<Sidebar>
			<AppSidebarHeader />
			<SidebarHeader>
				<ProgramSwitcher />
				<ClassSwitcher />
			</SidebarHeader>
			<SidebarAnimatedContent mode="class">
				<SidebarContent>
					<SidebarGroup>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									render={<Link href={programPath(programAlias, "classes")} />}
								>
									<IconArrowLeft /> Classes
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
					<SidebarGroup>
						<SidebarGroupLabel>ACADEMICS</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{classNavItems.map((item) => (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											isActive={isClassNavActive(currentSegment, item.segment)}
											render={<ClassLink segment={item.segment} />}
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
