import { expect } from "vitest";
import type { AppErrorCode } from "#helpers/constants";

export async function expectAppError(
	promise: Promise<unknown>,
	expected: AppErrorCode,
) {
	await expect(promise).rejects.toMatchObject({
		data: {
			code: expected.code,
			message: expected.message,
		},
	});
}
