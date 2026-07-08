import { v } from "convex/values";
import type { InsRole } from "../better-auth/ins-permissions";
import { components } from "./_generated/api";
import { insQuery, userMutation, userQuery } from "./helpers/customFunctions";
import { formInstitutionUrl } from "./helpers/utils";
import * as OwnerOrganizations from "./model/ownerOrganization";
import { vv } from "./schema";

export const resolveLandingPath = userQuery({
	args: {},
	returns: {
		redirectUrl: vv.string(),
	},
	handler: async (ctx) => {
		const user = await ctx.runQuery(components.betterAuth.users.getById, {
			userId: ctx.session.userId,
		});

		if (user.role === "owner") {
			const organization = await OwnerOrganizations.getByUserId(ctx, {
				userId: ctx.session.userId,
			});

			return {
				redirectUrl: organization
					? `/${organization.slug}`
					: "/owner/onboarding",
			};
		}

		if (ctx.session.activeInstitutionId) {
			const institution = await ctx.runQuery(
				components.betterAuth.institutions.getById,
				{
					id: ctx.session.activeInstitutionId,
				},
			);

			return {
				redirectUrl: institution
					? formInstitutionUrl(institution.slug)
					: "/institution-not-found",
			};
		}

		return {
			redirectUrl: "/not-part-of-any-institution",
		};
	},
});

/** Returns a short-lived URL for uploading a user profile image */
export const generateProfileImageUploadUrl = userMutation({
	args: {},
	returns: vv.string(),
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	},
});

/** Resolves a Convex storage ID to a public URL for use in Better Auth user.image */
export const resolveStorageUrl = userMutation({
	args: { storageId: v.id("_storage") },
	returns: vv.string(),
	handler: async (ctx, args) => {
		const url = await ctx.storage.getUrl(args.storageId);
		if (!url) {
			throw new Error("Failed to resolve storage URL");
		}
		return url;
	},
});

export const getCurrentUserInInstitution = insQuery({
	args: {},
	returns: vv.object({
		_id: vv.string(),
		email: vv.string(),
		image: vv.nullable(vv.string()),
		name: vv.string(),
		role: vv.union(
			vv.literal("owner"),
			vv.literal("faculty"),
			vv.literal("principal"),
		),
	}),
	handler: (ctx) => {
		return {
			_id: ctx.session.user._id,
			email: ctx.session.user.email,
			image: ctx.session.user.name,
			name: ctx.session.user.name,
			role: ctx.membership.role as InsRole,
		};
	},
});
