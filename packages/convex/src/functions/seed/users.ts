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

import { fakerEN_IN as faker } from "@faker-js/faker";
import type { Infer } from "convex/values";
import { components } from "../_generated/api";
import { env, internalMutation } from "../_generated/server";
import { authComponent, createAuth } from "../auth";
import type { Doc as BetterAuthDoc } from "../betterAuth/_generated/dataModel";
import { ERROR_CODES, throwAppError } from "../helpers/constants";
import * as OwnerOrganization from "../model/ownerOrganization";

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

const adminEmail = env.SUPER_ADMIN_EMAIL;

/**
 * **Seeds an admin which is set in the dashboard environment vars without password**
 *
 * Run this function using dashboard in production to insert the admin creds into the app.
 * You can also run this function using convex run command in terminal only in development environment.
 *
 * ```bash
 * # inside packages/convex
 * bun x convex run seed/users:admin
 * ```
 */
export const superadmin = internalMutation({
	args: {},
	handler: async (ctx) => {
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
					role: "superadmin",
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

type User = Pick<BetterAuthDoc<"user">, "email" | "name">;

type Owner = User & {
	org: Omit<Infer<typeof OwnerOrganization.OwnerOrgSchema>, "ownerId">;
};

/**
 * **Seeds list of owners with their organization details.**
 *
 * ```bash
 * # inside packages/convex
 * bun x convex run seed/users:owners
 * ```
 */
export const owners = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!env.SEED_MODE)
			throwAppError(ERROR_CODES.SEED.NOT_ALLOWED_IN_PRODUCTION);

		console.info("Seeding owners with their organization 🌱");

		const { auth } = await authComponent.getAuth(createAuth, ctx);

		for await (const owner of ownersList) {
			const { user } = await auth.api.createUser({
				body: {
					name: owner.name,
					email: owner.email,
					role: "owner",
					password: env.SEED_PASSWORD,
					data: { emailVerified: true },
				},
			});

			await OwnerOrganization.create(ctx, { ...owner.org, ownerId: user.id });

			console.info(`Owner ${owner.name} in the house ✅`);
		}
	},
});

/**
 * **Seed institutions into owner organization**
 *
 * Before running this function make sure you have owners in your db
 *
 * ```bash
 * # inside packages/convex
 * bun x convex run seed/users:institutions
 * ```
 */
export const institutions = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!env.SEED_MODE)
			throwAppError(ERROR_CODES.SEED.NOT_ALLOWED_IN_PRODUCTION);

		console.info(" 🌱 Seeding institutions");

		const { auth } = await authComponent.getAuth(createAuth, ctx);

		// Get all owners _id's inside the users table
		const owners = await ctx.runQuery(components.betterAuth.adapter.findMany, {
			model: "user",
			select: ["id"],
			paginationOpts: { numItems: 10, cursor: null },
			where: [{ field: "role", operator: "eq", value: "owner" }],
		});

		const COUNT = 5;

		// Static seed info
		faker.seed(123);

		for (const owner of owners.page) {
			for (let i = 0; i < COUNT; i++) {
				const name = `${faker.person.firstName()} ${faker.helpers.arrayElement(["Polytechnic", "PU College", "Degree College", "University", "High School", "Engineering College"])}`;
				const slug = faker.helpers.slugify(name).toLowerCase();
				const addressLine = faker.location.streetAddress({
					useFullAddress: true,
				});
				const code = faker.number.int({ max: 999 }).toString();
				const district = faker.location.city();
				const state = faker.location.state();
				const zipCode = faker.location.zipCode();

				await auth.api.createOrganization({
					body: {
						name,
						slug,
						userId: owner._id,
						addressLine,
						code,
						district,
						state,
						zipCode,
					},
				});

				console.info(` ✅ ${name} created`);
			}
		}
	},
});
