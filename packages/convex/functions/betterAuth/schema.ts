import { defineSchema } from "convex/server";
import { typedV } from "convex-helpers/validators";
import schema, { tables } from "./authSchema";

export default defineSchema({
	...tables,
});

export const vv = typedV(schema);
