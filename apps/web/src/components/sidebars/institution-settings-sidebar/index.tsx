"use client";

import { api } from "@instello/convex/api";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconArrowLeft, IconBuilding, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NewProgramDialog } from "@/features/programs/components/new-program-dialog";
import { ProgramAvatar } from "@/features/programs/components/program-avatar";
import { useInsQuery } from "@/hooks/convex-react";
import { getInstitutionSettingsProgramId } from "@/lib/sidebar-mode";

export function InstitutionSettingsSidebarContent() {
	const pathname = usePathname();
	const programs = useInsQuery(api.program.queries.list, {});
	const [addOpen, setAddOpen] = useState(false);
	const activeProgramId = getInstitutionSettingsProgramId(pathname);
	const isGeneralActive =
		pathname === "/institution-settings" ||
		pathname === "/institution-settings/";

	return (
		<>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton render={<Link href="/programs" />}>
							<IconArrowLeft /> Back to programs
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarGroup>
				<SidebarGroupLabel>GENERAL</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								size="sm"
								isActive={isGeneralActive}
								render={<Link href="/institution-settings" />}
							>
								<IconBuilding className="size-4" />
								Institution info
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarGroup>
				<SidebarGroupLabel>PROGRAMS</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{programs === undefined ? (
							<>
								<SidebarMenuItem>
									<Skeleton className="mx-2 h-8 w-[calc(100%-1rem)]" />
								</SidebarMenuItem>
								<SidebarMenuItem>
									<Skeleton className="mx-2 h-8 w-[calc(100%-1rem)]" />
								</SidebarMenuItem>
							</>
						) : (
							programs.map((program) => (
								<SidebarMenuItem key={program._id}>
									<SidebarMenuButton
										size="sm"
										isActive={activeProgramId === program._id}
										render={
											<Link href={`/institution-settings/p/${program._id}`} />
										}
									>
										<ProgramAvatar name={program.name} size="sm" />
										<span className="truncate">{program.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))
						)}
						<SidebarMenuItem>
							<SidebarMenuButton size="sm" onClick={() => setAddOpen(true)}>
								<IconPlus className="size-4" />
								Add program
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			<NewProgramDialog open={addOpen} setOpen={setAddOpen} />
		</>
	);
}
