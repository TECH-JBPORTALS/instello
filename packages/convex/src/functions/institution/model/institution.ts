import type { AppQueryCtx } from "../../model/common.types";
import type { InstitutionListItem } from "../validator/institution";
import * as InstitutionAcademicPattern from "./institutionAcademicPattern";

export type { InstitutionPatch } from "../validator/institution";

type BetterAuthInstitution = {
	_id: string;
	name: string;
	slug: string;
	logo?: string | null;
	code: string;
	addressLine: string;
	district: string;
	state: string;
	country: string;
	zipCode: string;
	createdAt: number;
};

/** Maps a Better Auth institution document to the API DTO. */
export async function toDto(
	ctx: AppQueryCtx,
	institution: BetterAuthInstitution,
): Promise<InstitutionListItem> {
	const adoptedPattern =
		await InstitutionAcademicPattern.getAdoptedPatternSummary(
			ctx,
			institution._id,
		);

	return {
		_id: institution._id,
		name: institution.name,
		slug: institution.slug,
		logo: institution.logo,
		code: institution.code,
		addressLine: institution.addressLine,
		district: institution.district,
		state: institution.state,
		country: institution.country,
		zipCode: institution.zipCode,
		createdAt: institution.createdAt,
		adoptedPattern: adoptedPattern,
	};
}
