"use client";

import { api } from "@instello/convex/api";
import { authClient } from "@instello/convex/better-auth/client";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@instello/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@instello/ui/components/dropdown-menu";
import {
	SidebarFooter,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import { Skeleton } from "@instello/ui/components/skeleton";
import { IconChevronDown, IconLogout, IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { formatInstitutionRole } from "@/components/sidebars/institution-sidebar/nav-items";
import { useInsQuery } from "@/hooks/convex-react";
import { protocol, rootDomain } from "@/lib/utils";

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

export function InstitutionSidebarFooter() {
	const user = useInsQuery(api.users.getCurrentUserInInstitution);

	async function handleLogout() {
		await authClient.signOut();
		window.location.href = `${protocol}://app.${rootDomain}/sign-in`;
	}

	return (
		<SidebarFooter>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<SidebarMenuButton
									size="lg"
									className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
								/>
							}
						>
							{user === undefined ? (
								<>
									<Skeleton className="size-8 rounded-full" />
									<div className="grid flex-1 gap-1 text-left">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-16" />
									</div>
								</>
							) : (
								<>
									<Avatar size="sm">
										{user.image ? (
											<AvatarImage src={user.image} alt={user.name} />
										) : null}
										<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-semibold">{user.name}</span>
										<span className="truncate text-xs text-muted-foreground">
											{formatInstitutionRole(user.role)}
										</span>
									</div>
								</>
							)}
							<IconChevronDown className="ml-auto size-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-[--anchor-width] min-w-56 rounded-lg"
							side="top"
							align="end"
							sideOffset={4}
						>
							<DropdownMenuItem render={<Link href="/settings" />}>
								<IconSettings className="size-4" />
								User Settings
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" onClick={handleLogout}>
								<IconLogout className="size-4" />
								Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarFooter>
	);
}
