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
						<div className="w-24 h-5 relative">
							<Image src={"/instello.svg"} alt="Instello" fill />
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroup>
		</SidebarHeader>
	);
}
