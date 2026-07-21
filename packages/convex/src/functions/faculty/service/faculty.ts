import type { Doc } from "#_generated/dataModel";
import type { FacultyResult } from "#faculty/validator/faculty";
import type { AppQueryCtx } from "#model/common.types";

export async function toDto(
	ctx: AppQueryCtx,
	faculty: Doc<"faculty">,
): Promise<FacultyResult> {
	const imageUrl = faculty.image
		? await ctx.storage.getUrl(faculty.image)
		: null;

	return {
		_id: faculty._id,
		staffId: faculty.staffId,
		firstName: faculty.firstName,
		lastName: faculty.lastName,
		dateOfBirth: faculty.dateOfBirth,
		email: faculty.email,
		image: imageUrl ?? undefined,
		designation: faculty.designation,
		joinedDate: faculty.joinedDate,
		qualification: faculty.qualification,
		specialization: faculty.specialization,
		phone: faculty.phone,
		status: faculty.status,
		insRole: faculty.insRole ?? "faculty",
		createdAt: faculty.createdAt,
		updatedAt: faculty.updatedAt,
	};
}
