import { v } from "convex/values";
import type { InsRole } from "../better-auth/ins-permissions";
import { components } from "./_generated/api";
import { insQuery, userMutation, userQuery } from "./helpers/customFunctions";
import { formInstitutionUrl } from "./helpers/utils";
import * as OwnerOrganizations from "./model/ownerOrganization";
import * as ProgramFaculty from "./program/model/programFaculty";
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

		/* 1. Check if user is owner redirect him to the organization page */
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

		/* 2. Check if user is have any active institution id in his session redirect him to that */
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

		/* 3. If he doesn't have active instituion check weather he is part of any institution, redirect him to the first institution */
		const institution = await ctx.runQuery(
			components.betterAuth.institutions.firstByUser,
			{ userId: ctx.session.userId },
		);

		if (institution) {
			return {
				redirectUrl: formInstitutionUrl(institution.slug),
			};
		}

		/** 4. If he is not part of any institution just redirect him to the not part of any institution page */
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

/** Get current active institution for the user */
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
		isHeadOfProgram: vv.boolean(),
		hopProgram: vv.nullable(
			vv.object({
				_id: vv.id("programs"),
				alias: vv.string(),
				name: vv.string(),
			}),
		),
	}),
	handler: async (ctx) => {
		const hopProgram =
			(ctx.membership.role as InsRole) === "faculty"
				? await ProgramFaculty.getHopProgramForUser(
						ctx,
						ctx.institution._id,
						ctx.session.userId,
					)
				: null;

		return {
			_id: ctx.session.user._id,
			email: ctx.session.user.email,
			image: ctx.session.user.image ?? null,
			name: ctx.session.user.name,
			role: ctx.membership.role as InsRole,
			isHeadOfProgram: hopProgram !== null,
			hopProgram,
		};
	},
});
