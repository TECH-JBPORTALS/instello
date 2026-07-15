import { AuthShell } from "@/components/auth/common";
import { AcceptInvitation } from "@/features/invitation/components/accept-invitation";

export default async function InvitationPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const { token } = await searchParams;

	return (
		<AuthShell>
			<AcceptInvitation token={token ?? null} />
		</AuthShell>
	);
}
