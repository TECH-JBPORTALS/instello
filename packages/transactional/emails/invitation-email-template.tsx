import { Heading, Hr, Link, Section, Text } from "react-email";
import { Email } from "../components/email";
import { EmailButton } from "../components/email-button";
import { EmailFooter } from "../components/email-footer";
import { EmailHeader } from "../components/email-header";

export type InvitationStaffRole = "faculty" | "principal";

export type InvitationEmailTemplateProps = {
	inviteeName?: string;
	inviteeEmail: string;
	invitedByName: string;
	invitedByEmail: string;
	institutionName: string;
	role: InvitationStaffRole;
	inviteLink: string;
};

const roleLabels: Record<InvitationStaffRole, string> = {
	faculty: "Faculty",
	principal: "Principal",
};

function greetingName({
	inviteeName,
	inviteeEmail,
}: Pick<InvitationEmailTemplateProps, "inviteeName" | "inviteeEmail">) {
	if (inviteeName?.trim()) return inviteeName.trim();
	const local = inviteeEmail.split("@")[0];
	return local || "there";
}

export function InvitationEmailTemplate({
	inviteeName,
	inviteeEmail,
	invitedByName,
	invitedByEmail,
	institutionName,
	role,
	inviteLink,
}: InvitationEmailTemplateProps) {
	const previewText = `Join ${institutionName} on Instello`;
	const roleLabel = roleLabels[role];
	const name = greetingName({ inviteeName, inviteeEmail });

	return (
		<Email preview={previewText}>
			<EmailHeader />
			<Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-foreground">
				Join <strong>{institutionName}</strong> on <strong>Instello</strong>
			</Heading>
			<Text className="text-[14px] text-foreground leading-[24px]">
				Hello {name},
			</Text>
			<Text className="text-[14px] text-foreground leading-[24px]">
				<strong>{invitedByName}</strong> (
				<Link
					href={`mailto:${invitedByEmail}`}
					className="text-primary no-underline"
				>
					{invitedByEmail}
				</Link>
				) has invited you to join <strong>{institutionName}</strong> as{" "}
				<strong>{roleLabel}</strong> on <strong>Instello</strong>.
			</Text>
			<Section className="mt-8 mb-8 text-center">
				<EmailButton href={inviteLink}>Accept invitation</EmailButton>
			</Section>
			<Text className="text-[14px] text-foreground leading-[24px]">
				or copy and paste this URL into your browser:{" "}
				<Link href={inviteLink} className="text-primary no-underline">
					{inviteLink}
				</Link>
			</Text>
			<Hr className="mx-0 my-[26px] w-full border border-solid border-border" />
			<Text className="text-[12px] text-muted-foreground leading-[24px]">
				This invitation was intended for{" "}
				<span className="text-foreground">{inviteeEmail}</span>. If you were not
				expecting this invitation, you can ignore this email.
			</Text>
			<EmailFooter />
		</Email>
	);
}

InvitationEmailTemplate.PreviewProps = {
	inviteeName: "Alan Turing",
	inviteeEmail: "alan.turing@example.com",
	invitedByName: "Jane Doe",
	invitedByEmail: "jane@ksit.edu",
	institutionName: "KSIT",
	role: "faculty",
	inviteLink: "https://ksit.instello.in/accept-invitation/preview",
} satisfies InvitationEmailTemplateProps;

export default InvitationEmailTemplate;
