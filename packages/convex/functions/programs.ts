import { query } from "./_generated/server";

export const list = query({
	args: {},
	handler(ctx) {
		return ctx.db.query("programs").take(10);
	},
});
