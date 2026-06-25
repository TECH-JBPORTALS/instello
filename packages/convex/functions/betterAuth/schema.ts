import { defineSchema } from "convex/server";
import { typedV } from "convex-helpers/validators";
import { tables } from "./authSchema";

const schema = defineSchema({
	...tables,

	// Define auth schema idex
});

export const vv = typedV(schema);
export default schema;
