/**
 * seed/users
 *
 * This file always contains internal functions only. It's recommended to keep that way.
 * Functions should not be at any chance get access by the frontend applications beaware of it.
 *
 * Before using these functions set these variables in the convex dashboard
 *
 * // if shouldn't be added in the production
 * SEED_MODE = true
 * SEED_PASSWORD = <test-user-password>
 *
 * // Application admin email. Emails should always follow this template <name>+test@resend.dev
 * ADMIN_EMAIL = <email>
 */

import { ConvexError } from "convex/values";
import { components } from "~/_generated/api";
import { internalMutation } from "~/_generated/server";
import type { Doc as BetterAuthDoc } from "~/betterAuth/_generated/dataModel";
import { authComponent, createAuth } from "~/betterAuth/auth";
import type { OwnerOrg } from "~/betterAuth/ownerOrganizations";

const ownersList: Owner[] = [
	{
		email: "walter+test@resend.dev",
		name: "Walter White",
		org: {
			addressLine: "308 Egro line, 2nd cross",
			city: "Mexico",
			country: "US",
			name: "Empire Kingpin",
			postalCode: "890394",
			slug: "empire-kingpin",
			state: "Mexico",
		},
	},
	{
		email: "rajamatha+test@resend.dev",
		name: "Rajamatha",
		org: {
			addressLine: "3 hills up, near the holy river",
			city: "Mahishmathi",
			country: "India",
			name: "Mahishmathi Samsthanam",
			postalCode: "890394",
			slug: "jai-mahishmathi",
			state: "Mahishmathi Samrajya",
		},
	},
];

const adminEmail = process.env.ADMIN_EMAIL;

/**
 * Seeds an admin which is set in the dashboard environment vars without password.
 * Run this function using dashboard in production to insert the admin creds into the app.
 * You can also run this function using convex run command in terminal only in development environment.
 *
 * To seed an admin first make sure your in convex folder then run:
 * ```shell
 * bun x convex run seed/users:admin
 * ```
 */
export const admin = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!adminEmail)
			throw new ConvexError(
				"SUPER_ADMIN_EMAIL env variable not set in the convex dashboard",
			);

		console.info("Seeding super admin 🌱");

		const { auth } = await authComponent.getAuth(createAuth, ctx);

		const user = await ctx.runQuery(
			components.betterAuth.users.safeGetByEmail,
			{ email: adminEmail },
		);

		if (!user) {
			await auth.api.createUser({
				body: {
					email: adminEmail,
					role: "admin",
					name: "Instello Admin",
					data: { emailVerified: true },
				},
			});

			console.info("✅ Super admin inserted");
			return;
		}

		console.info("🛈 Super admin already exists");
	},
});

type User = Pick<BetterAuthDoc<"users">, "email" | "name">;

type Owner = User & { org: Omit<OwnerOrg, "ownerId"> };

/**
 * Seeds list of owners with their organization details.
 *
 * To seed first make sure your in convex folder then run:
 * ```shell
 * bun x convex run seed/users:owners
 * ```
 */
export const owners = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!process.env.SEED_MODE)
			throw new ConvexError("You can't seed in production environment");

		if (!process.env.SEED_PASSWORD)
			throw new ConvexError("SEED_PASSWORD not set in the convex dashboard");

		console.info("Seeding owners with their organization 🌱");

		const { auth } = await authComponent.getAuth(createAuth, ctx);

		for await (const owner of ownersList) {
			const { user } = await auth.api.createUser({
				body: {
					name: owner.name,
					email: owner.email,
					password: process.env.SEED_PASSWORD,
					data: { emailVerified: true },
				},
			});

			await ctx.runMutation(components.betterAuth.ownerOrganizations.create, {
				...owner.org,
				ownerId: user.id,
			});

			console.info(`Owner ${owner.name} in the house ✅`);
		}
	},
});
