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
import { programPath } from "@/features/programs/program-path";
import { useProgramAlias } from "@/hooks/use-program-alias";
import { getClassSegment } from "@/lib/sidebar-mode";
import { ClassLink } from "./class-link";
import { classNavGroups, isClassNavActive } from "./nav-items";

export function ClassSidebarContent() {
	const pathname = usePathname();
	const programAlias = useProgramAlias();
	const currentSegment = getClassSegment(pathname);

	return (
		<>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={<Link href={programPath(programAlias, "classes")} />}
						>
							<IconArrowLeft /> Classes
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			{classNavGroups.map((group) => (
				<SidebarGroup key={group.label}>
					<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{group.items.map((item) => (
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
			))}
		</>
	);
}
