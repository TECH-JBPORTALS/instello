import { ConvexBetterAuthGuard } from "@instello/convex/better-auth/provider";
import { SidebarInset, SidebarProvider } from "@instello/ui/components/sidebar";
import type { Metadata } from "next";
import { WorkspaceLoading } from "@/components/common/workspace-loading";
import { SyncActiveInstitution } from "@/components/sidebars/institution-sidebar/sync-active-institution";
import { SidebarLayoutClient } from "@/components/sidebars/sidebar-layout-client";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
	const { subdomain } = await params;

	return {
		title: `Instello - ${subdomain.toLocaleUpperCase()}`,
		description: `Manage your institution ${subdomain.toLocaleUpperCase()}.`,
		icons: {
			icon: "/favicon.ico",
		},
	};
}

export default function Layout({
	children,
	sidebar,
}: {
	children: React.ReactNode;
	sidebar: React.ReactNode;
}) {
	return (
		<ConvexBetterAuthGuard loadingComponent={<WorkspaceLoading />}>
			<SidebarProvider>
				<SyncActiveInstitution />
				<SidebarLayoutClient sidebar={sidebar} />
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</ConvexBetterAuthGuard>
	);
}
