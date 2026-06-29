import { ConvexBetterAuthGuard } from "@instello/convex/better-auth/provider";
import { SidebarInset, SidebarProvider } from "@instello/ui/components/sidebar";
import type { Metadata } from "next";
import { WorkspaceLoading } from "@/components/common/workspace-loading";
import { InstitutionSidebar } from "@/components/sidebars/institution-sidebar";
import { SyncActiveInstitution } from "@/components/sidebars/institution-sidebar/sync-active-institution";

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

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<ConvexBetterAuthGuard loadingComponent={<WorkspaceLoading />}>
			<SidebarProvider>
				<SyncActiveInstitution />
				<InstitutionSidebar />
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</ConvexBetterAuthGuard>
	);
}
