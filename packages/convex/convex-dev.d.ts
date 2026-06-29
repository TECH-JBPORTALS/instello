export {};

declare module "convex/server" {
	interface UserIdentity {
		activeInstitutionId: string | null;
		sessionId: string | null;
	}
}
