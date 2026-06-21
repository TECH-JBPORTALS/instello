import { isAuthenticated } from "@instello/convex/better-auth/server";
import { redirect } from "next/navigation";

export default async function UnAuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	if (await isAuthenticated()) redirect(`/`);

	return <>{children}</>;
}
