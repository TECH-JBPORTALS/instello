import type { Id } from "./_generated/dataModel";
import { ERROR_CODES, throwAppError } from "./helpers/constants";
import type { UserMutationCtx } from "./helpers/customFunctions";
import { userMutation } from "./helpers/customFunctions";
import * as AcademicPattern from "./model/academicPattern";
import * as AcademicStage from "./model/academicStage";
import * as OwnerOrganization from "./model/ownerOrganization";
import { vv } from "./schema";

async function requireOwnerOrg(ctx: UserMutationCtx) {
	const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
		userId: ctx.session.userId,
	});

	if (!ownerOrg) {
		throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
	}

	return ownerOrg;
}

async function requirePatternInOwnerOrg(
	ctx: UserMutationCtx,
	patternId: Id<"academicPatterns">,
) {
	const ownerOrg = await requireOwnerOrg(ctx);

	const pattern = await AcademicPattern.getById(ctx, patternId, ownerOrg._id);

	if (!pattern) {
		throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
	}

	return { ownerOrg, pattern };
}

/** Update stage name and alias (always allowed) */
export const patchMetadata = userMutation({
	args: {
		id: vv.id("academicStages"),
		body: AcademicStage.PatchMetadataSchema,
	},
	returns: vv.null(),
	handler: async (ctx, args) => {
		const stage = await AcademicStage.getById(ctx, args.id);

		if (!stage) {
			throwAppError(ERROR_CODES.ACADEMIC_STAGE.NOT_FOUND);
		}

		await requirePatternInOwnerOrg(ctx, stage.academicPatternId);

		await AcademicStage.patchMetadata(ctx, args.id, args.body);

		return null;
	},
});
