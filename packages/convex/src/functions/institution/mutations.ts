import { components } from "../_generated/api";
import { insMutation } from "../helpers/customFunctions";
import { vv } from "../schema";
import { InstitutionPatchSchema } from "./validator/institution";

/** Update institution profile fields (slug and code are not editable) */
export const update = insMutation({
	permissions: ["institution:update"],
	args: {
		body: InstitutionPatchSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		await ctx.runMutation(components.betterAuth.adapter.updateOne, {
			input: {
				model: "institution",
				where: [{ field: "_id", value: ctx.institution._id }],
				update: {
					...args.body,
					name: args.body.name?.trim(),
					addressLine: args.body.addressLine?.trim(),
					district: args.body.district?.trim(),
					state: args.body.state?.trim(),
					country: args.body.country?.trim(),
					zipCode: args.body.zipCode?.trim(),
				},
			},
		});

		return null;
	},
});
