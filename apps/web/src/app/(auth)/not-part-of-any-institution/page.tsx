import { AuthShell } from "@/components/auth/common";
import { NotPartOfAnyInstitution } from "@/components/auth/not-part-of-any-institution";

export default function Page() {
	return (
		<AuthShell>
			<NotPartOfAnyInstitution />
		</AuthShell>
	);
}
