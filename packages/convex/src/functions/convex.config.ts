import resend from "@convex-dev/resend/convex.config.js";
import { defineApp } from "convex/server";
import { v } from "convex/values";
import betterAuth from "./betterAuth/convex.config";

const app = defineApp({
	env: {
		SITE_URL: v.string(),
		SUPER_ADMIN_EMAIL: v.string(),
		BETTER_AUTH_SECRET: v.string(),
		NODE_ENV: v.union(
			v.literal("development"),
			v.literal("production"),
			v.literal("preview"),
		),
		RESEND_API_KEY: v.string(),
		RESEND_FROM_EMAIL: v.string(),

		// Dev only vars
		SEED_MODE: v.optional(v.union(v.literal("true"), v.literal("false"))),
		SEED_PASSWORD: v.optional(v.string()),
	},
});

app.use(betterAuth);
app.use(resend);

export default app;
