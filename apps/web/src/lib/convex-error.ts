import type { AppErrorCode } from "@instello/convex/errors";
import { ConvexError } from "convex/values";

export function getConvexErrorData(error: unknown): AppErrorCode | null {
	if (!(error instanceof ConvexError)) return null;

	const data = error.data;
	if (
		typeof data === "object" &&
		data !== null &&
		"code" in data &&
		"message" in data &&
		typeof data.code === "string" &&
		typeof data.message === "string"
	) {
		return { code: data.code, message: data.message };
	}

	return null;
}

export function getConvexErrorMessage(
	error: unknown,
	fallback: string,
): string {
	return getConvexErrorData(error)?.message ?? fallback;
}

export function isConvexErrorCode(error: unknown, code: string): boolean {
	return getConvexErrorData(error)?.code === code;
}
