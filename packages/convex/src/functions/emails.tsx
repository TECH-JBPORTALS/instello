"use node";

import { Resend } from "@convex-dev/resend";
import { InvitationEmailTemplate } from "@instello/transactional/emails/invitation-email-template";
import { pretty, render } from "@react-email/render";
import { components } from "#_generated/api";
import { env, internalAction } from "#_generated/server";
import { vv } from "#schema";

export const resend: Resend = new Resend(components.resend, {
	apiKey: env.RESEND_API_KEY,
	testMode: env.NODE_ENV !== "production",
});

const resendFromEmail = env.RESEND_FROM_EMAIL;

/** Send an invitatoin email to the user when being invited to join an institution */
export const sendInvitationEmail = internalAction({
	args: {
		email: vv.string(),
		institutionName: vv.string(),
		invitedByName: vv.string(),
		invitedByEmail: vv.string(),
		token: vv.string(),
		role: vv.union(vv.literal("faculty"), vv.literal("principal")),
	},
	handler: async (ctx, args) => {
		const html = await pretty(
			await render(
				<InvitationEmailTemplate
					institutionName={args.institutionName}
					inviteeEmail={args.email}
					invitedByName={args.invitedByName}
					invitedByEmail={args.invitedByEmail}
					role={args.role}
					inviteLink={`${env.SITE_URL}/invitation?token=${args.token}`}
				/>,
			),
		);

		await resend.sendEmail(ctx, {
			from: resendFromEmail,
			to: args.email,
			subject: `Invitation to join ${args.institutionName} on Instello`,
			html,
		});
	},
});
