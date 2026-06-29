import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
	...defaultStatements,
	program: ["view", "create", "update", "delete"],
	class: ["view", "create", "update", "delete"],
	faculty: ["view", "create", "update", "activate"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Global `owner` of the organization(connected directly to his user record) who owns multiple institutions.
 * Check out [`functions/betterAuth/schema.ts`](../functions/betterAuth/schema.ts) for more info.
 */
export const owner = ac.newRole({
	...ownerAc.statements,
	program: ["create", "update", "delete", "view"],
	class: ["create", "update", "delete", "view"],
	faculty: ["create", "update", "activate", "view"],
});

/**
 * `principal` is admin of the institution, he has every access except deleting
 * the institution and changing the owner of the institution
 */
export const principal = ac.newRole({
	...adminAc.statements,
	program: ["update", "view"],
	class: ["create", "update", "delete", "view"],
	faculty: ["create", "update", "activate", "view"],
});

/**
 * `faculty` is an member of the institution he doesn't have much more permissions
 * as far as reading basic institution info is concerned. But he is not limited to
 * perform further actions within the institution.
 */
export const faculty = ac.newRole({
	...memberAc.statements,
	program: ["view"],
	class: ["view"],
	faculty: ["view"],
});

export const insRoles = {
	owner,
	principal,
	faculty,
} as const;

export type InsRole = keyof typeof insRoles;

// Helper methods

type Resource = keyof typeof statement;

type Action<R extends Resource> = (typeof statement)[R][number];

export type InsPermission = {
	[R in Resource]: `${R}:${Action<R>}`;
}[Resource];

export function toPermissionObject(
	permissions: InsPermission[],
): Record<string, string[]> {
	const result: Record<string, string[]> = {};

	for (const permission of permissions) {
		const [resource, action] = permission.split(":");

		if (!result[resource]) {
			result[resource] = [];
		}

		result[resource].push(action);
	}

	return result;
}

export function hasPermission(
	roleStatements: Record<string, readonly string[]>,
	required: Record<string, string[]>,
) {
	for (const [resource, actions] of Object.entries(required)) {
		const allowed = roleStatements[resource] ?? [];

		for (const action of actions) {
			if (!allowed.includes(action)) {
				return false;
			}
		}
	}
	return true;
}
