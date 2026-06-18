import { userQuery } from "~/helpers/customFunctions";

export const list = userQuery({
	args: {},
	handler(ctx) {
		return ctx.db.query("programs").take(10);
	},
});
