import { createAccessControl } from "better-auth/plugins/access";
import {
	adminAc,
	defaultStatements,
	userAc,
} from "better-auth/plugins/admin/access";

const statement = {
	...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/**
 * `superadmin` is godmode of the instello, he has every access to the application
 */
export const superadmin = ac.newRole({
	...adminAc.statements,
});

/**
 * `owner` owns one organization always
 */
export const owner = ac.newRole({
	...userAc.statements,
});

/**
 * `user` is either student or staff people to the institutions
 */
export const user = ac.newRole({
	...userAc.statements,
});
