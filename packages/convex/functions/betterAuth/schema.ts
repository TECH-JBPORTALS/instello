import { defineSchema } from "convex/server";
import { tables } from "./authSchema";

export default defineSchema({
	...tables,
});
