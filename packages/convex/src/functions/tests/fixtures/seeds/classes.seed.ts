import type { Doc, Id } from "../../../_generated/dataModel";
import type { AppMutationCtx } from "../../../model/common.types";
import { CLASS_1, CLASS_2, CLASS_3 } from "../constants.setup";

export type SeededClasses = {
	class1: Doc<"classes">;
	class2: Doc<"classes">;
	class3: Doc<"classes">;
	ins1Program: [Doc<"classes">, Doc<"classes">];
	ins2Program: [Doc<"classes">];
	program1Classes: [Doc<"classes">, Doc<"classes">];
	program2Classes: [Doc<"classes">];
};

export async function seedClasses(
	ctx: AppMutationCtx,
	args: {
		program1Id: Id<"programs">;
		program2Id: Id<"programs">;
	},
): Promise<SeededClasses> {
	const now = Date.now();

	const class1Id = await ctx.db.insert("classes", {
		programId: args.program1Id,
		name: CLASS_1.name,
		description: CLASS_1.description,
		academicYear: CLASS_1.academicYear,
		semester: CLASS_1.semester,
		createdAt: now,
		updatedAt: now,
		status: "active",
		isGroupsEnabled: false,
	});

	const class2Id = await ctx.db.insert("classes", {
		programId: args.program1Id,
		name: CLASS_2.name,
		description: CLASS_2.description,
		academicYear: CLASS_2.academicYear,
		semester: CLASS_2.semester,
		createdAt: now,
		updatedAt: now,
		status: "active",
		isGroupsEnabled: false,
	});

	const class3Id = await ctx.db.insert("classes", {
		programId: args.program2Id,
		name: CLASS_3.name,
		description: CLASS_3.description,
		academicYear: CLASS_3.academicYear,
		semester: CLASS_3.semester,
		createdAt: now,
		updatedAt: now,
		status: "active",
		isGroupsEnabled: false,
	});

	const class1 = await ctx.db.get("classes", class1Id);
	const class2 = await ctx.db.get("classes", class2Id);
	const class3 = await ctx.db.get("classes", class3Id);

	if (!class1 || !class2 || !class3) {
		throw new Error("Failed to seed classes");
	}

	const ins1Program = [class1, class2] as [Doc<"classes">, Doc<"classes">];
	const ins2Program = [class3] as [Doc<"classes">];

	return {
		class1,
		class2,
		class3,
		ins1Program,
		ins2Program,
		program1Classes: ins1Program,
		program2Classes: ins2Program,
	};
}
