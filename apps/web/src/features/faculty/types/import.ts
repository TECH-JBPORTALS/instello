export type ImportPhase =
	| "idle"
	| "validating"
	| "validationError"
	| "ready"
	| "importing"
	| "importError"
	| "success";

export type ImportRowStatus =
	| "pending"
	| "validating"
	| "valid"
	| "invalid"
	| "uploading"
	| "success"
	| "error"
	| "skipped";

export type FacultyImportRowData = {
	staffId: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	email: string;
	designation: string;
	qualification: string;
	specialization: string;
	joinedDate?: number;
	phoneNumber: string;
	addressLine: string;
	district: string;
	state: string;
	country: string;
	zipCode: string;
	profilePicUrl?: string;
};

export type ImportValidationError = {
	rowIndex: number;
	column: string;
	message: string;
};

export type ImportRow = {
	index: number;
	displayRow: number;
	data: FacultyImportRowData | null;
	status: ImportRowStatus;
	errorMessage?: string;
};

export type ImportSnapshot = {
	staffId: string;
	email: string;
};
