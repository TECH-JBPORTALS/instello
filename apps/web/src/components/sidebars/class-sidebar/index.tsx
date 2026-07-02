"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { programPath } from "@/lib/program-path";
import { getClassSegment } from "@/lib/sidebar-mode";
import { ClassLink } from "./class-link";
import { classNavItems, isClassNavActive } from "./nav-items";

export function ClassSidebarContent() {
	const pathname = usePathname();
	const programAlias = useProgramAlias();
	const currentSegment = getClassSegment(pathname);

	return (
		<>
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
				<SidebarGroupLabel>CLASS</SidebarGroupLabel>
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
		</>
	);
}
