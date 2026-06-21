import { ConvexError, type Infer } from "convex/values";
import { mutation } from "./_generated/server";
import { vv } from "./schema";

export const OwnerOrgSchema = vv
	.doc("ownerOrganizations")
	.omit("_creationTime", "_id", "createdAt", "updatedAt");

export type OwnerOrg = Infer<typeof OwnerOrgSchema>;

export const create = mutation({
	args: OwnerOrgSchema,
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_id", (q) => q.eq("_id", args.ownerId))
			.first();

		if (!user) throw new ConvexError("No user found to attach organization");

		await ctx.db.insert("ownerOrganizations", {
			...args,
			ownerId: user._id,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
	},
});
