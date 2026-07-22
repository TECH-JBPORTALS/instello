"use client";

import { Badge } from "@instello/ui/components/badge";
import { SidebarHeader } from "@instello/ui/components/sidebar";
import { ProgramAvatar } from "@/features/programs/components/program-avatar";

export function HopProgramHeader({ name }: { name: string }) {
	return (
		<SidebarHeader>
			<div className="flex items-center gap-2 px-2 py-1.5">
				<ProgramAvatar name={name} size="sm" />
				<span className="min-w-0 truncate font-medium text-sm">{name}</span>
				<Badge
					variant="outline"
					className="shrink-0 ml-auto text-muted-foreground uppercase text-xs!"
				>
					HOP
				</Badge>
			</div>
		</SidebarHeader>
	);
}
