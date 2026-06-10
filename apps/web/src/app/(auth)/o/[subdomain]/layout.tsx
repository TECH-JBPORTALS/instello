import { SidebarInset, SidebarProvider } from "@instello/ui/components/sidebar";
import type { Metadata } from "next";
import { OrganizationSidebar } from "@/components/sidebars/organization-sidebar";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
	const { subdomain } = await params;

	return {
		title: `Instello - ${subdomain.toLocaleUpperCase()}`,
		description: `Manage your organization ${subdomain.toLocaleUpperCase()}.`,
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
