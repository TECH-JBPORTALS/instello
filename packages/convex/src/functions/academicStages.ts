import { ERROR_CODES, throwAppError } from "./helpers/constants";
import { userMutation } from "./helpers/customFunctions";
import * as AcademicPattern from "./model/academicPattern";
import * as AcademicStage from "./model/academicStage";
import * as OwnerOrganization from "./model/ownerOrganization";
import { vv } from "./schema";

/** Updates a stage display name and alias. Allowed even when the parent pattern is locked. */
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

		const ownerOrg = await OwnerOrganization.getByUserId(ctx, {
			userId: ctx.session.userId,
		});

		if (!ownerOrg) {
			throwAppError(ERROR_CODES.OWNER_ORGANIZATION.NOT_FOUND);
		}

		const pattern = await AcademicPattern.getById(
			ctx,
			stage.academicPatternId,
			ownerOrg._id,
		);

		if (!pattern) {
			throwAppError(ERROR_CODES.ACADEMIC_PATTERN.NOT_FOUND);
		}

		await AcademicStage.patchMetadata(ctx, args.id, args.body);

		return null;
	},
});
