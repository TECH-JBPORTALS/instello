"use client";

import {
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from "@instello/ui/components/sidebar";
import Image from "next/image";

export function AppSidebarHeader() {
	return (
		<SidebarHeader>
			<SidebarGroup>
				<SidebarMenu>
					<SidebarMenuItem>
						<Image
							src={"/instello.svg"}
							alt="Instello"
							width={92}
							height={18}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		</SidebarHeader>
	);
}
