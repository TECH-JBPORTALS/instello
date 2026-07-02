import type { Id } from "@instello/convex/dataModel";

export type SubjectFieldProps = {
	subjectId: Id<"subjects">;
	savedValue: string;
};

export type SubjectSettingsProps = {
	subject: {
		_id: Id<"subjects">;
		name: string;
		code: string;
		alias: string;
		color: string;
		description?: string;
	};
};
