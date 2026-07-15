import { components } from "#_generated/api";
import { query } from "#_generated/server";
import * as Faculty from "#faculty/model/faculty";
import { vv } from "#schema";

/** Preview invitation details for the accept page (no auth required). */
export const getPreview = query({
	args: { invitationId: vv.string() },
	returns: vv.nullable(
		vv.object({
			email: vv.string(),
			organizationName: vv.string(),
			suggestedName: vv.optional(vv.string()),
		}),
	),
	handler: async (ctx, args) => {
		const invitationId = args.invitationId.trim();
		if (!invitationId) return null;

		const preview = await ctx.runQuery(
			components.betterAuth.invitations.getPreview,
			{ invitationId },
		);
		if (!preview) return null;

		const faculty = await Faculty.findByEmail(
			ctx,
			preview.organizationId,
			preview.email,
		);

		const suggestedName = faculty
			? `${faculty.firstName} ${faculty.lastName}`.trim()
			: undefined;

		return {
			email: preview.email,
			organizationName: preview.organizationName,
			...(suggestedName ? { suggestedName } : {}),
		};
	},
});
