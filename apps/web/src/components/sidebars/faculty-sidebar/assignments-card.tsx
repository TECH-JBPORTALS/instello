"use client";

import { api } from "@instello/convex/api";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@instello/ui/components/empty";
import {
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@instello/ui/components/sidebar";
import { IconCaretRightFilled, IconClipboardList } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { assignedSubjectPath } from "@/features/faculty-workspace/assigned-subject-key";
import { SubjectAvatar } from "@/features/subjects/components/subject-avatar";
import { useInsQuery } from "@/hooks/convex-react";
import { cn } from "@/lib/utils";

export function FacultyAssignmentsCard() {
	const pathname = usePathname();
	const groups = useInsQuery(api.class.queries.listMyAssignedSubjects);
	const [openClassIds, setOpenClassIds] = useState<Record<string, boolean>>({});

	if (groups === undefined) {
		return null;
	}

	if (groups.length === 0) {
		return (
			<div className="px-2 pb-2">
				<Empty className="gap-2!">
					<EmptyMedia variant="icon">
						<IconClipboardList className="size-4" />
					</EmptyMedia>
					<EmptyHeader className="gap-0!">
						<EmptyTitle className="text-sm!">No assignments</EmptyTitle>
						<EmptyDescription className="text-xs!">
							Your administrator will assign subjects to you soon.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			</div>
		);
	}

	function isOpen(classId: string) {
		return openClassIds[classId] ?? true;
	}

	function toggle(classId: string) {
		setOpenClassIds((prev) => ({
			...prev,
			[classId]: !(prev[classId] ?? true),
		}));
	}

	return (
		<SidebarMenu>
			{groups.map((group) => {
				const open = isOpen(group.classId);
				const label = `${group.programAlias.toUpperCase()} - ${group.className}`;

				return (
					<SidebarMenuItem key={group.classId}>
						<SidebarMenuButton
							size="sm"
							onClick={() => toggle(group.classId)}
							aria-expanded={open}
						>
							<IconCaretRightFilled
								className={cn(
									"text-muted-foreground size-3! transition-transform",
									open && "rotate-90",
								)}
							/>
							<span className="truncate font-bold text-muted-foreground">
								{label}
							</span>{" "}
							<SidebarMenuBadge>{group.subjects.length}</SidebarMenuBadge>
						</SidebarMenuButton>

						{open ? (
							<SidebarMenuSub>
								{group.subjects.map((subject) => {
									const href = assignedSubjectPath({
										programAlias: group.programAlias,
										classSlug: group.classSlug,
										subjectAlias: subject.alias,
									});
									const isActive =
										pathname === href || pathname.startsWith(`${href}/`);

									return (
										<SidebarMenuSubItem key={subject.programSubjectId}>
											<SidebarMenuSubButton
												size="sm"
												isActive={isActive}
												render={<Link href={href} />}
											>
												<SubjectAvatar
													size="xs"
													color={subject.color}
													name={subject.name}
												/>
												<span className="truncate">{subject.name}</span>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									);
								})}
							</SidebarMenuSub>
						) : null}
					</SidebarMenuItem>
				);
			})}
		</SidebarMenu>
	);
}
