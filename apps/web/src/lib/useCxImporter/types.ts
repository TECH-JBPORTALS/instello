import type { GenericSchema, InferOutput } from "valibot";

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

export type ImportColumnSchema<TOutput = unknown> = {
	possibleNames: string[];
	required?: boolean;
	validator: GenericSchema<TOutput, string>;
};

export type ImportSchema = Record<string, ImportColumnSchema>;

export type InferImportRow<S extends ImportSchema> = {
	[K in keyof S]: InferOutput<S[K]["validator"]>;
};

export type ImportValidationError = {
	rowIndex: number;
	column: string;
	message: string;
};

export type ImportRow<TData> = {
	index: number;
	displayRow: number;
	data: TData | null;
	status: ImportRowStatus;
	errorMessage?: string;
};

export type ParsedImportFile<S extends ImportSchema> = {
	headers: string[];
	rows: Record<keyof S & string, string>[];
};

export type ImportRowSnapshot = Record<string, string | number | boolean>;

export type ImportRowResult =
	| { ok: true; createdCount?: number }
	| { ok: false; message: string };

export type UseCxImporterOptions<S extends ImportSchema> = {
	schema: S;
	onImportRow: (
		row: InferImportRow<S>,
		ctx: { index: number; displayRow: number },
	) => Promise<ImportRowResult>;
	resumeIdentityFields?: (keyof InferImportRow<S> & string)[];
	validationStaggerMs?: number;
};

export type UseCxImporterReturn<S extends ImportSchema> = {
	phase: ImportPhase;
	rows: ImportRow<InferImportRow<S>>[];
	validationErrors: ImportValidationError[];
	completedCount: number;
	importError: string | null;
	failedRowIndex: number | null;
	fileName: string | null;
	successCount: number;
	hasFile: boolean;
	isBusy: boolean;
	canStartImport: boolean;
	validatedCount: number;
	importedCount: number;
	activeRowIndex: number | null;
	invalidRowCount: number;
	validRowCount: number;
	totalRows: number;
	validateFile: (
		file: File,
		options?: { autoResume?: boolean },
	) => Promise<void>;
	startImport: () => Promise<void>;
	reset: () => void;
};
