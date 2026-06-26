import { SidebarInset, SidebarProvider } from "@instello/ui/components/sidebar";
import type { Metadata } from "next";
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
		<SidebarProvider>
			<OrganizationSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
