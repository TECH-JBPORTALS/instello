import { defineSchema } from "convex/server";
import { typedV } from "convex-helpers/validators";
import { tables } from "./authSchema";

const schema = defineSchema({
	...tables,
	user: tables.user.index("role", ["role"]),
	institution: tables.institution.index("code", { fields: ["code"] }),
	institutionMember: tables.institutionMember
		.index("by_role_user", ["role", "userId"])
		.index("by_organization_user", ["organizationId", "userId"]),

	// Define auth schema idex
});

export const vv = typedV(schema);
export default schema;
