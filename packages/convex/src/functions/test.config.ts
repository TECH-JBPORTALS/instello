/// <reference types="vite/client" />

export const modules = import.meta.glob([
	"./**/*.{js,ts}",
	"!./**/*.d.ts",
	"!./**/*.test.ts",
	"!./**/*.test.tsx",
	"!./**/*.setup.ts",
	"!./**/*.seed.ts",
]);

export const betterAuthModules = import.meta.glob([
	"./betterAuth/**/*.{js,ts}",
	"!./**/*.d.ts",
	"!./**/*.test.ts",
	"!./**/*.setup.ts",
]);
