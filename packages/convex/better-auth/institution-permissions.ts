import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
	...defaultStatements,
	program: ["create", "read", "delete", "update"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Global `owner` of the organization(connected directly to his user record) who owns multiple institutions.
 * Check out [`functions/betterAuth/schema.ts`](../functions/betterAuth/schema.ts) for more info.
 */
export const owner = ac.newRole({
	...ownerAc.statements,
	program: ["create", "update", "delete", "read"],
});

/**
 * `principal` is admin of the institution, he has every access except deleting
 * the institution and changing the owner of the institution
 */
export const principal = ac.newRole({
	...adminAc.statements,
	program: ["create", "update", "delete", "read"],
});

/**
 * `faculty` is an member of the institution he doesn't have much more permissions
 * as far as reading basic institution info is concerned. But he is not limited to
 * perform further actions within the institution.
 */
export const faculty = ac.newRole({
	...memberAc.statements,
	program: ["read"],
});
