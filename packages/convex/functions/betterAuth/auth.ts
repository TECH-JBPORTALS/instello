import { createAuth } from "~/auth";

// Export a static instance for Better Auth schema generation
// biome-ignore lint/suspicious/noExplicitAny: <No need props for static generation>
export const auth = createAuth({} as any);
