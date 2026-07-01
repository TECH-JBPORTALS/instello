import { ConvexBetterAuthGuard } from "@instello/convex/better-auth/provider";
import { SidebarInset, SidebarProvider } from "@instello/ui/components/sidebar";
import type { Metadata } from "next";
import { MainAreaTopLoader } from "@/components/common/main-area-top-loader";
import { WorkspaceLoading } from "@/components/common/workspace-loading";
import { OrganizationSidebar } from "@/components/sidebars/organization-sidebar";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
	const { orgSlug } = await params;

	return {
		title: `Instello - ${orgSlug.toLocaleUpperCase()}`,
		description: `Manage your organization ${orgSlug.toLocaleUpperCase()}.`,
		icons: {
			icon: "/favicon.ico",
		},
	};
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<ConvexBetterAuthGuard loadingComponent={<WorkspaceLoading />}>
			<MainAreaTopLoader />
			<SidebarProvider>
				<OrganizationSidebar />
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</ConvexBetterAuthGuard>
	);
}
