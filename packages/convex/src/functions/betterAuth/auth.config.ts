import { createAuth } from "../auth";

// Export a static instance for Better Auth schema generation
// biome-ignore lint/suspicious/noExplicitAny: <Just a placeholder for schema generation>
export const auth = createAuth({} as any);
