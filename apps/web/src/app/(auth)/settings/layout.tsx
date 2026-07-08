import { ConvexBetterAuthGuard } from "@instello/convex/better-auth/provider";
import { WorkspaceLoading } from "@/components/common/workspace-loading";

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ConvexBetterAuthGuard loadingComponent={<WorkspaceLoading />}>
			{children}
		</ConvexBetterAuthGuard>
	);
}
