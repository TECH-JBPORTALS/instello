import { insMutation, insQuery } from "~/helpers/customFunctions";
import * as Program from "~/model/programs";
import { vv } from "./schema";

export const create = insMutation({
	args: Program.CreateSchema,
	handler: Program.create,
});

export const list = insQuery({
	args: {},
	returns: vv.array(vv.doc("programs")),
	handler: Program.list,
});

export const getById = insQuery({
	args: Program.GetByIdSchema,
	return: vv.doc("programs"),
	handler: Program.getById,
});

export const updateAlias = insMutation({
	args: Program.UpdateAliasSchema,
	return: vv.doc("programs"),
	handler: Program.updateAlias,
});
