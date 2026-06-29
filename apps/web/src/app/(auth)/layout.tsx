import { isAuthenticated } from "@instello/convex/better-auth/server";
import { redirect } from "next/navigation";
import { protocol, rootDomain } from "@/lib/utils";

export default async function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!(await isAuthenticated()))
		redirect(`${protocol}://app.${rootDomain}/sign-in`);

	return <>{children}</>;
}
