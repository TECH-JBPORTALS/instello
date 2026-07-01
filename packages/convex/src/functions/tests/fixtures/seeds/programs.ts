import type { Doc } from "../../../_generated/dataModel";
import type { AppMutationCtx } from "../../../model/common.types";
import { PROGRAM_CE, PROGRAM_CS, PROGRAM_ME } from "../constants";

export type SeededPrograms = {
	me: Doc<"programs">;
	cs: Doc<"programs">;
	ce: Doc<"programs">;
};

export async function seedPrograms(
	ctx: AppMutationCtx,
	args: {
		user1: { _id: string };
		user2: { _id: string };
		ins1: { _id: string };
		ins2: { _id: string };
	},
): Promise<SeededPrograms> {
	const now = Date.now();

	const meId = await ctx.db.insert("programs", {
		name: PROGRAM_ME.name,
		alias: PROGRAM_ME.alias,
		createdAt: now,
		updatedAt: now,
		createdBy: args.user1._id,
		institutionId: args.ins1._id,
		status: "active",
	});

	const csId = await ctx.db.insert("programs", {
		name: PROGRAM_CS.name,
		alias: PROGRAM_CS.alias,
		createdAt: now,
		updatedAt: now,
		createdBy: args.user1._id,
		institutionId: args.ins1._id,
		status: "active",
	});

	const ceId = await ctx.db.insert("programs", {
		name: PROGRAM_CE.name,
		alias: PROGRAM_CE.alias,
		createdAt: now,
		updatedAt: now,
		createdBy: args.user2._id,
		institutionId: args.ins2._id,
		status: "active",
	});

	const me = await ctx.db.get("programs", meId);
	const cs = await ctx.db.get("programs", csId);
	const ce = await ctx.db.get("programs", ceId);

	if (!me || !cs || !ce) {
		throw new Error("Failed to seed programs");
	}

	return { me, cs, ce };
}
