import { isAuthenticated } from "@instello/convex/better-auth/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!(await isAuthenticated())) redirect(`/sign-in`);

	return <>{children}</>;
}
