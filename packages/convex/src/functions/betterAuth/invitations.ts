import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { vv } from "./schema";

/**
 * Public invitation preview for the accept-invitation page.
 * Invitation IDs are unguessable, so email + org name are safe to expose.
 */
export const getPreview = query({
	args: { invitationId: vv.string() },
	returns: vv.nullable(
		vv.object({
			email: vv.string(),
			organizationId: vv.string(),
			organizationName: vv.string(),
		}),
	),
	handler: async (ctx, args) => {
		const invitation = await ctx.db.get(
			args.invitationId as Id<"institutionInvitation">,
		);

		if (invitation?.status !== "pending") return null;

		const institution = await ctx.db.get(
			invitation.organizationId as Id<"institution">,
		);
		if (!institution) return null;

		return {
			email: invitation.email,
			organizationId: invitation.organizationId,
			organizationName: institution.name,
		};
	},
});
