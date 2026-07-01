import { seedOwners } from "../seeds/owners";
import { baseTest } from "./base";

const owner = baseTest()
	.extend("owners", async ({ t }) => await t.run(seedOwners))
	.extend("user1", ({ owners }) => owners.user1)
	.extend("user2", ({ owners }) => owners.user2);

export function ownerTest() {
	return owner;
}
