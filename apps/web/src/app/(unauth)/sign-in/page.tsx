import { AuthShell } from "@/components/auth/common";
import { SignIn } from "@/components/auth/sign-in";

export default function Page() {
	return (
		<AuthShell>
			<SignIn />
		</AuthShell>
	);
}
